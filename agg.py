import csv, json

# settlement code -> name
targets = {
3000:"ירושלים",5000:"תל אביב-יפו",4000:"חיפה",8300:"ראשון לציון",7900:"פתח תקווה",
70:"אשדוד",7400:"נתניה",9000:"באר שבע",6100:"בני ברק",6600:"חולון",8600:"רמת גן",
7100:"אשקלון",8400:"רחובות",6200:"בת ים",2610:"בית שמש",6900:"כפר סבא",6400:"הרצליה",
6500:"חדרה",1200:"מודיעין-מכבים-רעות",7300:"נצרת",7000:"לוד",8500:"רמלה",8700:"רעננה",
6300:"גבעתיים",2710:"אום אל-פחם",9100:"נהריה",2630:"קריית גת",6800:"קריית אתא",
2600:"אילת",6700:"טבריה"
}
# extra easy ones - need codes; will detect by name
extra_names = {"נס ציונה","גבעת שמואל","כפר יונה","אור יהודה"}
extra_canon = {}  # raw name kept

# party label -> hebrew column symbol
parties = {
"likud":"מחל","yesh_atid":"פה","religious_zionism":"ט","national_unity":"כן",
"shas":"שס","utj":"ג","yisrael_beytenu":"ל","labor":"אמת","meretz":"מרצ",
"hadash_taal":"ום","balad":"ד","raam":"עם"
}

with open("ballot25.csv", encoding="utf-8-sig") as f:
    r = csv.DictReader(f)
    cols = r.fieldnames
    code_col = cols[3]   # סמל ישוב
    name_col = cols[2]
    kosher_col = cols[10]  # כשרים
    agg = {}  # code -> {name, kosher, party votes...}
    name_to_code = {}
    for row in r:
        try:
            code = int(row[code_col])
        except:
            continue
        nm = row[name_col].strip()
        if code in targets or nm in extra_names:
            canon = targets.get(code, nm)
            a = agg.setdefault(code, {"name":canon,"kosher":0,"votes":{p:0 for p in parties}})
            a["kosher"] += int(row[kosher_col] or 0)
            for p,sym in parties.items():
                a["votes"][p] += int(row.get(sym) or 0)

# build output
out = []
# preserve requested order for the 30, then extras
order = list(targets.keys())
# find extra codes
for code,a in agg.items():
    if code not in targets and code not in order:
        order.append(code)

for code in order:
    if code not in agg: 
        print("MISSING code", code, targets.get(code))
        continue
    a = agg[code]
    k = a["kosher"]
    shares = {}
    best=None; bestv=-1
    for p in parties:
        pct = round(100.0*a["votes"][p]/k,1) if k else 0.0
        shares[p]=pct
        if a["votes"][p]>bestv:
            bestv=a["votes"][p]; best=p
    out.append({"name_he":a["name"],"winner":best,"shares":shares,
                "src":"https://raw.githubusercontent.com/harelc/elections-vote-transfer/master/ballot25.csv",
                "confidence":"high"})

result={"cities":out,"notes":""}
print(json.dumps(result,ensure_ascii=False,indent=1))

with open("result.json","w",encoding="utf-8") as fo:
    json.dump(result,fo,ensure_ascii=False,indent=1)
