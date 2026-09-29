const SPREADSHEET_ID='1zcITdOnkDRijY-lajtLIy4l3IgHaTO5wvLCjR6DN3hE';
const GOOGLE_CLIENT_ID='950115107076-o51fm3q7l494ka3mqh7t5v5rce2vdhuj.apps.googleusercontent.com';

function json_(obj){
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function verifyGoogleToken_(token){
  if(!token)throw new Error('缺少登入憑證');
  const url='https://oauth2.googleapis.com/tokeninfo?id_token='+encodeURIComponent(token);
  const res=UrlFetchApp.fetch(url,{muteHttpExceptions:true});
  if(res.getResponseCode()!==200)throw new Error('Google 登入憑證驗證失敗');

  const info=JSON.parse(res.getContentText());
  if(info.aud!==GOOGLE_CLIENT_ID)throw new Error('OAuth Client ID 不符');
  if(info.email_verified!=='true'&&info.email_verified!==true)throw new Error('Google 帳號尚未驗證 Email');

  const ownerEmail=Session.getEffectiveUser().getEmail();
  if(!ownerEmail)throw new Error('無法取得 Apps Script 擁有者帳號');
  if(String(info.email||'').toLowerCase()!==String(ownerEmail).toLowerCase()){
    throw new Error('這個 Google 帳號沒有使用權限');
  }
  return info;
}

function sheet_(type){
  const name=type==='groups'?'groups':type==='bookmarks'?'bookmarks':'';
  if(!name)throw new Error('未知資料表');
  const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(name);
  if(!sh)throw new Error('找不到工作表：'+name);
  return sh;
}

function headers_(type){
  return type==='groups'
    ?['id','name','sortOrder']
    :['id','groupId','url','title','name','note','sortOrder'];
}

function normalize_(type,row){
  const out={};
  headers_(type).forEach(k=>out[k]=row[k]==null?'':row[k]);
  return out;
}

function list_(type){
  const sh=sheet_(type),h=headers_(type),last=sh.getLastRow();
  if(last<2)return[];
  return sh.getRange(2,1,last-1,h.length).getValues()
    .filter(r=>String(r[0]).trim())
    .map(r=>{
      const o={};
      h.forEach((k,i)=>o[k]=r[i]);
      return o;
    });
}

function findRow_(type,id){
  const sh=sheet_(type),last=sh.getLastRow();
  if(last<2)return 0;
  const ids=sh.getRange(2,1,last-1,1).getDisplayValues().flat();
  const i=ids.findIndex(v=>v===String(id));
  return i<0?0:i+2;
}

function append_(type,data,forcedId){
  const sh=sheet_(type),h=headers_(type);
  const id=forcedId||Utilities.getUuid();
  const row=normalize_(type,Object.assign({},data,{id}));
  sh.appendRow(h.map(k=>row[k]));
  return id;
}

function update_(type,id,data){
  const sh=sheet_(type),h=headers_(type),rowNo=findRow_(type,id);
  if(!rowNo)throw new Error('找不到資料：'+id);
  const old=sh.getRange(rowNo,1,1,h.length).getValues()[0];
  const merged={};
  h.forEach((k,i)=>merged[k]=old[i]);
  Object.keys(data||{}).forEach(k=>{
    if(h.includes(k)&&k!=='id')merged[k]=data[k];
  });
  sh.getRange(rowNo,1,1,h.length).setValues([h.map(k=>merged[k])]);
}

function delete_(type,id){
  const sh=sheet_(type),rowNo=findRow_(type,id);
  if(rowNo)sh.deleteRow(rowNo);
}

function doGet(){
  return json_({ok:true,service:'yuyu-bookmarks-sheets-api-v2'});
}

function doPost(e){
  const lock=LockService.getScriptLock();
  try{
    const req=JSON.parse((e&&e.postData&&e.postData.contents)||'{}');
    verifyGoogleToken_(req.token);
    lock.waitLock(15000);

    if(req.action==='list')return json_({ok:true,items:list_(req.type)});
    if(req.action==='add')return json_({ok:true,id:append_(req.type,req.data||{},req.id||'')});

    if(req.action==='update'){
      update_(req.type,req.id,req.data||{});
      return json_({ok:true});
    }

    if(req.action==='delete'){
      delete_(req.type,req.id);
      return json_({ok:true});
    }

    if(req.action==='batch'){
      (req.ops||[]).forEach(op=>{
        if(op.op==='delete')delete_(op.type,op.id);
        if(op.op==='update')update_(op.type,op.id,op.data||{});
        if(op.op==='set'){
          const rowNo=findRow_(op.type,op.id);
          rowNo?update_(op.type,op.id,op.data||{}):append_(op.type,op.data||{},op.id);
        }
      });
      return json_({ok:true});
    }

    throw new Error('未知操作');
  }catch(err){
    return json_({ok:false,error:String(err&&err.message?err.message:err)});
  }finally{
    try{lock.releaseLock()}catch(_){}
  }
}