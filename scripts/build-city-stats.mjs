// Builds data/city-stats.json from raw 2022 CEC per-party shares + CBS 2021 clusters.
// Vote shares: official CEC K25 ballot data (harelc mirror). Clusters: CBS 2021 index.
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const PARTIES = {
  likud:            { he: 'הליכוד',           color: '#2f6fdb', bloc: 'right' },
  religious_zionism:{ he: 'הציונות הדתית',    color: '#e0742e', bloc: 'right' },
  shas:             { he: 'ש"ס',              color: '#16a085', bloc: 'right' },
  utj:              { he: 'יהדות התורה',      color: '#444f66', bloc: 'right' },
  yesh_atid:        { he: 'יש עתיד',          color: '#4f8ef7', bloc: 'center' },
  national_unity:   { he: 'המחנה הממלכתי',    color: '#3752a3', bloc: 'center' },
  labor:            { he: 'העבודה',           color: '#d9385a', bloc: 'left' },
  meretz:           { he: 'מרצ',              color: '#7db83f', bloc: 'left' },
  yisrael_beytenu:  { he: 'ישראל ביתנו',      color: '#6b8bb5', bloc: 'secular-right' },
  hadash_taal:      { he: 'חד"ש-תע"ל',        color: '#c0392b', bloc: 'arab' },
  balad:            { he: 'בל"ד',             color: '#8e44ad', bloc: 'arab' },
  raam:             { he: 'רע"מ',             color: '#1f7a3d', bloc: 'arab' },
};

// cluster (CBS 2021, 1-10) + type per city
const CITY = {
  'ירושלים':{cluster:2,type:'mixed'}, 'תל אביב-יפו':{cluster:8,type:'general'}, 'חיפה':{cluster:7,type:'general'},
  'ראשון לציון':{cluster:7,type:'general'}, 'פתח תקווה':{cluster:7,type:'general'}, 'אשדוד':{cluster:5,type:'general'},
  'נתניה':{cluster:6,type:'general'}, 'באר שבע':{cluster:5,type:'general'}, 'בני ברק':{cluster:2,type:'haredi'},
  'חולון':{cluster:7,type:'general'}, 'רמת גן':{cluster:8,type:'general'}, 'אשקלון':{cluster:5,type:'general'},
  'רחובות':{cluster:7,type:'general'}, 'בת ים':{cluster:5,type:'general'}, 'בית שמש':{cluster:2,type:'haredi'},
  'כפר סבא':{cluster:8,type:'general'}, 'הרצליה':{cluster:8,type:'general'}, 'חדרה':{cluster:6,type:'general'},
  'מודיעין-מכבים-רעות':{cluster:8,type:'general'}, 'נצרת':{cluster:3,type:'arab'}, 'לוד':{cluster:3,type:'mixed'},
  'רמלה':{cluster:4,type:'mixed'}, 'רעננה':{cluster:8,type:'general'}, 'גבעתיים':{cluster:9,type:'general'},
  'אום אל-פחם':{cluster:2,type:'arab'}, 'נהריה':{cluster:6,type:'general'}, 'קריית גת':{cluster:4,type:'general'},
  'קריית אתא':{cluster:6,type:'general'}, 'אילת':{cluster:6,type:'general'}, 'טבריה':{cluster:3,type:'general'},
  'נס ציונה':{cluster:8,type:'general'},
};

// per-city 2022 vote shares (% of valid votes) — official CEC K25
const SHARES = {
  'ירושלים':{likud:19.1,yesh_atid:7.5,religious_zionism:14.2,national_unity:5.2,shas:18.3,utj:23.8,yisrael_beytenu:1.9,labor:2.5,meretz:2.8,hadash_taal:1.0,balad:0.6,raam:0.3},
  'תל אביב-יפו':{likud:17.0,yesh_atid:32.8,religious_zionism:4.5,national_unity:11.0,shas:4.3,utj:0.8,yisrael_beytenu:3.3,labor:9.3,meretz:10.9,hadash_taal:1.5,balad:1.5,raam:0.7},
  'חיפה':{likud:20.9,yesh_atid:26.3,religious_zionism:6.3,national_unity:10.1,shas:3.2,utj:3.8,yisrael_beytenu:8.1,labor:4.8,meretz:4.6,hadash_taal:5.7,balad:2.8,raam:0.8},
  'ראשון לציון':{likud:32.4,yesh_atid:25.2,religious_zionism:9.7,national_unity:13.8,shas:5.0,utj:0.7,yisrael_beytenu:6.3,labor:2.9,meretz:1.6,hadash_taal:0.1,balad:0.0,raam:0.0},
  'פתח תקווה':{likud:28.4,yesh_atid:19.8,religious_zionism:13.8,national_unity:10.6,shas:8.9,utj:4.4,yisrael_beytenu:6.0,labor:2.5,meretz:1.6,hadash_taal:0.1,balad:0.0,raam:0.0},
  'אשדוד':{likud:28.8,yesh_atid:12.7,religious_zionism:9.0,national_unity:6.6,shas:15.8,utj:13.7,yisrael_beytenu:10.3,labor:0.9,meretz:0.5,hadash_taal:0.0,balad:0.0,raam:0.0},
  'נתניה':{likud:35.5,yesh_atid:17.5,religious_zionism:11.4,national_unity:8.4,shas:12.2,utj:2.8,yisrael_beytenu:6.6,labor:1.8,meretz:1.1,hadash_taal:0.0,balad:0.0,raam:0.0},
  'באר שבע':{likud:40.3,yesh_atid:12.0,religious_zionism:15.7,national_unity:7.5,shas:9.0,utj:1.4,yisrael_beytenu:8.0,labor:1.9,meretz:1.0,hadash_taal:0.3,balad:0.2,raam:0.3},
  'בני ברק':{likud:3.4,yesh_atid:0.7,religious_zionism:4.4,national_unity:0.5,shas:30.2,utj:59.8,yisrael_beytenu:0.3,labor:0.2,meretz:0.1,hadash_taal:0.0,balad:0.0,raam:0.0},
  'חולון':{likud:34.6,yesh_atid:20.6,religious_zionism:10.2,national_unity:11.6,shas:10.5,utj:0.8,yisrael_beytenu:4.7,labor:2.8,meretz:1.6,hadash_taal:0.1,balad:0.0,raam:0.0},
  'רמת גן':{likud:22.3,yesh_atid:31.7,religious_zionism:7.1,national_unity:14.3,shas:4.0,utj:0.9,yisrael_beytenu:3.9,labor:6.6,meretz:5.5,hadash_taal:0.4,balad:0.1,raam:0.1},
  'אשקלון':{likud:39.7,yesh_atid:12.2,religious_zionism:13.3,national_unity:7.2,shas:11.8,utj:1.1,yisrael_beytenu:10.6,labor:1.2,meretz:0.6,hadash_taal:0.0,balad:0.0,raam:0.0},
  'רחובות':{likud:25.8,yesh_atid:23.1,religious_zionism:13.1,national_unity:10.6,shas:8.0,utj:3.6,yisrael_beytenu:5.2,labor:4.1,meretz:3.2,hadash_taal:0.2,balad:0.1,raam:0.1},
  'בת ים':{likud:35.7,yesh_atid:17.7,religious_zionism:10.8,national_unity:8.2,shas:9.8,utj:1.1,yisrael_beytenu:11.1,labor:1.9,meretz:1.0,hadash_taal:0.1,balad:0.1,raam:0.1},
  'בית שמש':{likud:15.5,yesh_atid:2.3,religious_zionism:14.7,national_unity:2.5,shas:21.6,utj:38.7,yisrael_beytenu:1.7,labor:0.4,meretz:0.2,hadash_taal:0.0,balad:0.0,raam:0.0},
  'כפר סבא':{likud:21.8,yesh_atid:35.9,religious_zionism:6.8,national_unity:12.8,shas:3.5,utj:0.5,yisrael_beytenu:3.8,labor:6.6,meretz:5.1,hadash_taal:0.2,balad:0.0,raam:0.1},
  'הרצליה':{likud:21.2,yesh_atid:37.2,religious_zionism:5.6,national_unity:14.1,shas:3.5,utj:0.8,yisrael_beytenu:3.5,labor:5.8,meretz:5.7,hadash_taal:0.2,balad:0.1,raam:0.1},
  'חדרה':{likud:38.2,yesh_atid:18.5,religious_zionism:10.4,national_unity:9.3,shas:8.8,utj:1.1,yisrael_beytenu:6.6,labor:2.5,meretz:1.5,hadash_taal:0.2,balad:0.1,raam:0.1},
  'מודיעין-מכבים-רעות':{likud:22.5,yesh_atid:30.9,religious_zionism:10.4,national_unity:16.2,shas:2.1,utj:0.5,yisrael_beytenu:3.3,labor:5.4,meretz:3.8,hadash_taal:0.1,balad:0.0,raam:0.1},
  'נצרת':{likud:2.3,yesh_atid:1.2,religious_zionism:0.1,national_unity:0.3,shas:0.1,utj:0.0,yisrael_beytenu:0.0,labor:0.5,meretz:1.7,hadash_taal:45.3,balad:26.2,raam:21.4},
  'לוד':{likud:28.5,yesh_atid:6.6,religious_zionism:15.5,national_unity:3.7,shas:9.3,utj:6.0,yisrael_beytenu:5.8,labor:0.9,meretz:0.6,hadash_taal:1.9,balad:15.7,raam:2.8},
  'רמלה':{likud:39.3,yesh_atid:6.2,religious_zionism:12.7,national_unity:5.0,shas:13.4,utj:0.4,yisrael_beytenu:3.1,labor:1.4,meretz:0.9,hadash_taal:4.1,balad:6.0,raam:5.9},
  'רעננה':{likud:20.5,yesh_atid:32.8,religious_zionism:9.9,national_unity:13.9,shas:5.0,utj:1.1,yisrael_beytenu:2.6,labor:5.0,meretz:4.6,hadash_taal:0.1,balad:0.0,raam:0.1},
  'גבעתיים':{likud:15.8,yesh_atid:37.6,religious_zionism:4.0,national_unity:14.9,shas:1.5,utj:0.5,yisrael_beytenu:3.3,labor:10.5,meretz:8.6,hadash_taal:0.5,balad:0.1,raam:0.1},
  'אום אל-פחם':{likud:0.7,yesh_atid:0.1,religious_zionism:0.1,national_unity:0.0,shas:0.3,utj:0.1,yisrael_beytenu:0.0,labor:0.3,meretz:1.0,hadash_taal:40.4,balad:38.0,raam:17.5},
  'נהריה':{likud:38.5,yesh_atid:17.4,religious_zionism:11.3,national_unity:9.8,shas:7.1,utj:0.4,yisrael_beytenu:9.6,labor:2.0,meretz:1.1,hadash_taal:0.2,balad:0.1,raam:0.2},
  'קריית גת':{likud:36.3,yesh_atid:8.2,religious_zionism:13.5,national_unity:6.4,shas:15.5,utj:8.6,yisrael_beytenu:7.7,labor:0.9,meretz:0.4,hadash_taal:0.0,balad:0.0,raam:0.0},
  'קריית אתא':{likud:42.8,yesh_atid:14.1,religious_zionism:12.2,national_unity:8.8,shas:10.0,utj:1.9,yisrael_beytenu:5.4,labor:1.6,meretz:0.6,hadash_taal:0.0,balad:0.0,raam:0.0},
  'אילת':{likud:43.7,yesh_atid:16.8,religious_zionism:11.1,national_unity:10.2,shas:6.7,utj:0.6,yisrael_beytenu:4.5,labor:1.8,meretz:1.2,hadash_taal:0.4,balad:0.2,raam:0.3},
  'טבריה':{likud:40.4,yesh_atid:5.9,religious_zionism:12.8,national_unity:5.3,shas:20.4,utj:8.6,yisrael_beytenu:3.8,labor:0.7,meretz:0.3,hadash_taal:0.1,balad:0.0,raam:0.1},
  'נס ציונה':{likud:23.6,yesh_atid:33.3,religious_zionism:7.5,national_unity:16.2,shas:3.7,utj:0.5,yisrael_beytenu:2.7,labor:6.2,meretz:3.9,hadash_taal:0.2,balad:0.0,raam:0.0},
};

// per-city socioeconomic metrics: [avg_wage NIS/mo 2021, %academic 25-65 2021, IDF men% , IDF women% (cohort 2003), unemployment% , employment%]
// avg_wage + %academic + employment/unemployment: CBS "הרשויות המקומיות בישראל 2022" (pub 1957). IDF: FOI release (meida.org.il/17690).
const METRICS = {
  'ירושלים':[9153,42.1,38.5,22.3,6.1,47.4], 'תל אביב-יפו':[16805,51.2,70.9,70.0,2.8,72.8], 'חיפה':[12368,42.9,68.9,66.4,3.3,61.0],
  'ראשון לציון':[12651,35.0,82.6,77.7,3.7,67.5], 'פתח תקווה':[12676,37.7,74.2,57.9,3.0,68.2], 'אשדוד':[10154,26.1,55.9,42.5,3.6,61.8],
  'נתניה':[10818,31.4,72.5,54.0,3.9,62.8], 'באר שבע':[10296,29.6,77.8,65.6,3.9,62.6], 'בני ברק':[7598,13.3,12.4,2.0,2.2,47.2],
  'חולון':[11241,28.8,78.3,70.4,2.8,66.2], 'רמת גן':[14954,47.6,81.8,77.8,2.7,71.7], 'אשקלון':[9946,27.7,76.0,60.3,4.4,62.6],
  'רחובות':[12977,43.3,75.2,60.0,2.6,67.1], 'בת ים':[9170,23.0,69.4,61.6,3.1,62.3], 'בית שמש':[8398,32.9,32.8,12.5,5.6,54.7],
  'כפר סבא':[15579,50.2,83.2,80.0,2.2,66.1], 'הרצליה':[16658,49.4,83.5,77.1,2.4,69.9], 'חדרה':[10697,27.9,77.2,69.5,5.3,65.6],
  'מודיעין-מכבים-רעות':[16708,60.2,89.5,81.3,2.3,75.5], 'נצרת':[8553,19.5,14.3,0.0,5.9,40.8], 'לוד':[8902,19.4,69.9,54.5,3.4,59.6],
  'רמלה':[9074,15.0,75.1,57.0,2.9,64.0], 'רעננה':[16593,55.3,80.5,70.0,3.0,65.3], 'גבעתיים':[17619,59.4,85.5,86.3,2.7,71.9],
  'אום אל-פחם':[7361,15.4,0.0,0.0,8.7,40.2], 'נהריה':[10946,32.7,80.1,71.1,6.5,59.4], 'קריית גת':[8962,19.5,66.2,50.4,3.0,67.2],
  'קריית אתא':[10524,24.9,78.8,67.3,3.5,65.2], 'אילת':[10236,19.6,76.9,72.8,null,71.5], 'טבריה':[8175,15.7,65.9,53.2,null,null],
  'נס ציונה':[15815,50.3,88.8,86.1,2.5,67.0],
};

const CENTER_LEFT = ['yesh_atid', 'national_unity', 'labor', 'meretz'];
const NETANYAHU = ['likud', 'religious_zionism', 'shas', 'utj'];

const cities = Object.keys(SHARES).map(name => {
  const shares = SHARES[name];
  const meta = CITY[name];
  if (!meta) throw new Error('no cluster for ' + name);
  const winner = Object.keys(shares).reduce((a, b) => shares[b] > shares[a] ? b : a);
  const sum = ks => +ks.reduce((s, k) => s + (shares[k] || 0), 0).toFixed(1);
  const mt = METRICS[name];
  if (!mt) throw new Error('no metrics for ' + name);
  const [avg_wage, pct_academic, idf_men, idf_women, unemployment, employment] = mt;
  return {
    name, cluster: meta.cluster, type: meta.type,
    likud: shares.likud, winner,
    center_left: sum(CENTER_LEFT), netanyahu_bloc: sum(NETANYAHU),
    avg_wage, pct_academic, idf_men, idf_women, unemployment, employment,
    shares,
  };
});

const out = {
  meta: {
    vote_source: 'ועדת הבחירות המרכזית — נתוני קלפי, בחירות לכנסת ה-25 (1.11.2022). אחוזים = קולות מפלגה מתוך הקולות הכשרים.',
    vote_url: 'https://votes25.bechirot.gov.il/',
    socio_source: 'מדד חברתי-כלכלי של הרשויות המקומיות, הלמ"ס (אפיון 2021), אשכולות 1 (נמוך) עד 10 (גבוה).',
    socio_url: 'https://he.wikipedia.org/wiki/דירוג_רשויות_מקומיות_בישראל',
    note: 'אחוז הליכוד/מפלגה הוא קירוב לתמיכה במנהיג, לא זהה לה. אשכול חברתי-כלכלי אינו מודד חוכמה או "איכות" של אנשים — הוא מדרג הכנסה, השכלה ותעסוקה בממוצע. הצבעה מושפעת מקהילה, מוצא, דת, גיל וגאוגרפיה, לא רק מכלכלה. מתאם ≠ סיבתיות.',
    metrics_source: 'הרשויות המקומיות בישראל 2022, הלמ"ס (פרסום 1957): שכר ממוצע לשכיר (2021), % בעלי תואר אקדמי (גילי 25–65, 2021), ותעסוקה/אבטלה. שיעורי גיוס לצה"ל (מחזור יליד 2003, התגייס 2024): נתוני אכ"א שפורסמו בעקבות בקשת חופש מידע (התנועה לחופש המידע).',
    metrics_note: 'הכנסה חציונית למשק בית אינה מתפרסמת ברמת עיר בלמ"ס — לכן מוצג במקומה השכר הממוצע לשכיר (נתון אמיתי לכל עיר). שיעורי הגיוס הנמוכים בערים הערביות (אזרחים ערבים פטורים מגיוס חובה) ובחרדיות (דחיית שירות) משקפים הסדרי פטור — לא "תרומה" נמוכה ובוודאי לא איכות אנשים.',
    center_left_parties: CENTER_LEFT, netanyahu_parties: NETANYAHU,
  },
  parties: PARTIES,
  cities,
};

writeFileSync(join(root, 'data', 'city-stats.json'), JSON.stringify(out, null, 1));
console.log(`city-stats.json: ${cities.length} cities, ${Object.keys(PARTIES).length} parties`);
