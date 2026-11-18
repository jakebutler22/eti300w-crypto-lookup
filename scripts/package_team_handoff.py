from pathlib import Path, PurePosixPath
from datetime import datetime, timezone
import hashlib, json, re, shutil, stat, subprocess, tarfile, zipfile
from package_frontend import RUNTIME_FILES

repo = Path(__file__).resolve().parent.parent
out = repo / 'deliverables'
out.mkdir(exist_ok=True)
name = 'ETI300W-27-Coin-Team-Handoff-2026-11-18'
stage = repo / '.artifacts/team-return-build' / name
if stage.exists():
    raise SystemExit('Staging folder already exists; choose a fresh folder')
stage.mkdir()
def digest(data): return hashlib.sha256(data).hexdigest()
def write(rel, data):
    dest = stage / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data.encode('utf-8') if isinstance(data,str) else data)
    dest.chmod(0o644)
def copy(src, rel):
    if not src.is_file() or src.is_symlink(): raise ValueError('Expected regular source file')
    write(rel, src.read_bytes())

sources = repo / 'docs/team-return'
for fn in ('EMAIL.txt','START_HERE.txt','TEAM_STATUS.md','NOLAN_REQUEST.md','ALEX_REQUEST.md','RELEASE_REVIEW.md','BACKEND_CANDIDATE_REVIEW.md','REQUESTED_CATALOG.csv'):
    copy(sources/fn, fn)
for fn in ('NOLAN_REPLY.md','ALEX_REPLY.md'):
    copy(sources/fn, 'RETURN_TO_JAKE/'+fn)

expected_runtime = set(RUNTIME_FILES)
manifests = {}
for mode, source, folder in (
    ('api',repo/'releases/explore-2026-11-18','01-web-release-API'),
    ('demo',repo/'releases/explore-2026-11-18','02-local-preview-DEMO')
):
    manifest_path=source/f'eti300w-frontend-{mode}.manifest.json'
    m=json.loads(manifest_path.read_text())
    archive=source/m['archive']['name']
    assert digest(archive.read_bytes())==m['archive']['sha256']
    assert m['mode']==mode
    hashes={f['path']:f for f in m['files']}
    assert set(hashes)==expected_runtime
    with tarfile.open(archive,'r:gz') as t:
        members=t.getmembers()
        assert {x.name for x in members}==expected_runtime
        for member in members:
            assert member.isfile() and not member.issym() and not member.islnk()
            assert not PurePosixPath(member.name).is_absolute() and '..' not in PurePosixPath(member.name).parts
            data=t.extractfile(member).read()
            assert digest(data)==hashes[member.name]['sha256'] and len(data)==hashes[member.name]['bytes']
            write(folder+'/'+member.name,data)
    copy(manifest_path,'release/'+manifest_path.name)
    if mode=='api': copy(archive,'release/'+archive.name)
    manifests[mode]=m

# Baseline API/demo release files must differ only by configured mode.
for fn in expected_runtime:
    a=(stage/'01-web-release-API'/fn).read_bytes()
    b=(stage/'02-local-preview-DEMO'/fn).read_bytes()
    if fn!='config.js': assert a==b
assert '"api"' in (stage/'01-web-release-API/config.js').read_text()
assert '"demo"' in (stage/'02-local-preview-DEMO/config.js').read_text()

backend = repo / 'handoff/backend-candidate'
backend_names = {'README_FOR_ALEX.md','requirements.txt','database.py','migration.sql','coinbase.py','.gitignore','.env.example','app.py','tests/test_backend.py'}
assert {str(x.relative_to(backend)) for x in backend.rglob('*') if x.is_file()}==backend_names
backend_hashes=[]
for fn in sorted(backend_names):
    data=(backend/fn).read_bytes()
    copy(backend/fn,'03-backend-candidate-REVIEW-ONLY/'+fn)
    backend_hashes.append({'path':fn,'bytes':len(data),'sha256':digest(data)})
write('03-backend-candidate-REVIEW-ONLY/READ_FIRST.txt',
      'REVIEW ONLY - Read ../BACKEND_CANDIDATE_REVIEW.md first.\n'
      'These nine supplied files are unchanged source material. They were not executed\n'
      'or deployed in this packaging task. Do not run the migration or follow remote\n'
      'write steps until the exact plan, backup, validation and restore are approved.\n'
      '.env.example contains placeholders only; never include a real environment file.\n'
      'This folder must not be uploaded to the public web root.\n')
write('reference/backend-candidate-provenance.json',json.dumps({
    'source':'User-supplied SharePoint ETI300W_Flask_Backend_Upgrade, downloaded through actual Safari',
    'receivedDate':'2026-11-18','representation':'Browser-provided extracted eti300w-backend-upgrade folder',
    'originalArchiveSHA256':None,'executionStatus':'Not executed during this packaging task',
    'deploymentStatus':'Not verified deployed','files':backend_hashes
},indent=2)+'\n')

copy(repo/'docs/evidence/api-2026-11-18-catalog-verification.json','reference/public-api-verification.json')

for fn in ('network-diagram.svg','network-diagram.png','network-diagram.pdf'):
    copy(repo/'docs/evidence/alex-2026-11-18'/fn,'reference/'+fn)
text=(repo/'docs/nolan-middleware.md').read_text()
text=text.split('## Assembly notes (keep outside the submitted narrative)')[0]
text=re.sub(r'Report-ready wording based on.*?upgraded frontend\.',
            'Working report section based on the received November 18 middleware narrative and attributed evidence. It describes the earlier observed deployment; the newer backend upgrade remains a separate candidate. Add actual dated screenshots and update facts after any approved release before submission.',text,count=1,flags=re.S)
write('reference/NOLAN_MIDDLEWARE_DRAFT.md',text.rstrip()+'\n')
write('reference/README.txt',
      'These are supporting references, not the single final Canvas submission.\n\n'
      'Alex supplied the editable SVG diagram and PNG/PDF exports on Nov. 18.\n'
      'Confirm resource associations and update the diagram only when actual topology changes.\n'
      'NOLAN_MIDDLEWARE_DRAFT.md is edited wording based on the prior deployment narrative.\n'
      'Pair it with actual service/query/API screenshots and update it after an approved upgrade.\n'
      'backend-candidate-provenance.json identifies every unchanged supplied candidate file.\n'
      'No screenshot has been fabricated or substituted for actual cloud evidence.\n')
write('RETURN_TO_JAKE/screenshots/README.txt',
      'Add actual readable cloud screenshots, not screenshots of written reports or text captures.\n'
      'For each, provide filename, capture time, source instance/role and a caption stating what it proves.\n'
      'Nolan: running middleware, successful request, coordinated actual app-to-DB query.\n'
      'Alex: three instances, service status, database schema/27 rows, private VPC path/rules/routes.\n'
      'Jake: finished hosted interface and acceptance checks after approved deployment.\n'
      'Redact credentials, keys, private addresses and unrelated personal details before returning.\n')
write('RETURN_TO_JAKE/api-examples/README.txt',
      'Add actual sanitized response JSON plus public path, HTTP status and capture time.\n'
      'Identify current deployment/version and whether it is before or after any approved upgrade.\n'
      'Requested examples: current27 catalog, BTC/ETH market success, safe failures, agreed combined success/failure.\n'
      'Do not label candidate README examples or mocked test fixtures as real deployed results.\n')
write('RETURN_TO_JAKE/changed-backend-files/README.txt',
      'Return only changes/corrections since the supplied upgrade, with a brief diff summary.\n'
      'Do not resend unchanged files or include .env, credentials, SSH keys, access keys or private addresses.\n'
      'Describe migrations as proposed or applied after specific approval, with real test evidence.\n')

commit=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
entries=[]
for f in sorted(stage.rglob('*')):
    if f.is_file():
        data=f.read_bytes()
        entries.append({'path':f.relative_to(stage).as_posix(),'bytes':len(data),'sha256':digest(data)})
write('PACKAGE_MANIFEST.json',json.dumps({
    'schemaVersion':1,'package':name,'preparedUTC':datetime.now(timezone.utc).isoformat(timespec='seconds'),
    'handoffSourceCommit':commit,'frontendTests':'115/115 passed locally; new backend candidate not executed',
    'deploymentStatus':'No deployment performed; specific remote-write approval required',
    'apiReleaseSHA256':manifests['api']['archive']['sha256'],'files':entries
},indent=2)+'\n')
archive=out/(name+'.zip')
if archive.exists(): raise SystemExit('Output already exists; refusing overwrite')
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
    for f in sorted(stage.rglob('*')):
        if f.is_file():
            zi=zipfile.ZipInfo(name+'/'+f.relative_to(stage).as_posix(),date_time=(2026,11,18,16,45,0))
            zi.create_system=3
            zi.external_attr=(stat.S_IFREG|0o644)<<16
            zi.compress_type=zipfile.ZIP_DEFLATED
            z.writestr(zi,f.read_bytes())
email=out/'EMAIL-27-Coin-to-Nolan-and-Alex-2026-11-18.txt'
if email.exists(): raise SystemExit('Email output already exists; refusing overwrite')
shutil.copyfile(sources/'EMAIL.txt',email)
(out/(archive.name+'.sha256')).write_text(digest(archive.read_bytes())+'  '+archive.name+'\n')
print(json.dumps({'zip':str(archive),'bytes':archive.stat().st_size,'files':len(entries)+1,'email':str(email),'sha256':digest(archive.read_bytes())},indent=2))
