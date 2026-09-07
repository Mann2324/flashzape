/* RentFlow payment/receipt enhancements: exact rent-period dates, account-aware receipts, payment editing/deletion and WhatsApp receipt sharing. */
(function(){
  const money2=n=>'₹'+Number(n||0).toLocaleString('en-IN');
  const pad=n=>String(n).padStart(2,'0');
  const fmt=d=>{if(!d)return '—';const x=new Date(d+'T00:00:00');return x.toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'});};
  const monthStart=d=>{const x=new Date(d+'T00:00:00');return `${x.getFullYear()}-${pad(x.getMonth()+1)}-01`;};
  const monthEnd=d=>{const x=new Date(d+'T00:00:00');const y=new Date(x.getFullYear(),x.getMonth()+1,0);return `${y.getFullYear()}-${pad(y.getMonth()+1)}-${pad(y.getDate())}`;};
  const getAccounts=()=>{
    const a=Array.isArray(db.settings?.accounts)?db.settings.accounts:[];
    return [0,1,2,3].map(i=>({name:a[i]?.name||'',last:String(a[i]?.last||'').replace(/\D/g,''),id:'a'+(i+1)})).filter(x=>x.name||x.last);
  };
  const getAccountText=p=>{const a=getAccounts().find(x=>x.id===p.receivedIn);return a?(a.name+(a.last?' — ****'+a.last.slice(-4):'')):(p.receivedIn||'Not identified / Cash');};
  function fillAccounts(){
    const sel=document.getElementById('pReceivedIn'); if(!sel)return;
    const old=sel.value,method=document.getElementById('pMethod')?.value;
    sel.innerHTML='<option value="">Not identified / Cash</option>';
    getAccounts().forEach(a=>{const o=document.createElement('option');o.value=a.id;o.textContent=(a.name||'Account')+(a.last?' — ****'+a.last.slice(-4):'');sel.appendChild(o)});
    if(old)sel.value=old;
    if(method==='Cash')sel.value='';
  }
  window.methodChanged=(function(orig){return function(){if(typeof orig==='function')orig();fillAccounts();};})(window.methodChanged);

  function advanceDue(x){
    const d=new Date(x.due+'T00:00:00');
    if(x.cycle==='weekly')d.setDate(d.getDate()+7);
    else if(x.cycle==='daily')d.setDate(d.getDate()+1);
    else {const day=d.getDate();const target=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(day,target));d.setMonth(d.getMonth()+1);}
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  }

  window.openPayment=function(id,paymentId){
    document.getElementById('paymentModal').classList.add('open');
    const sel=document.getElementById('pRental');
    sel.innerHTML=db.rentals.map(x=>`<option value="${x.id}">${esc(x.name||'Vacant')} — ${esc(x.item)}</option>`).join('');
    const editing=paymentId?db.payments.find(p=>p.id===paymentId):null;
    sel.value=editing?.rentalId||id||db.rentals[0]?.id||'';
    const x=rental(sel.value),received=document.getElementById('pDate');
    document.getElementById('pAmount').value=editing?.amount??x?.rent??'';
    received.value=editing?.date||today();
    document.getElementById('pRef').value=editing?.ref||'';
    document.getElementById('pMethod').value=editing?.method||'Cash';
    const fs=document.getElementById('pFrom'),ft=document.getElementById('pTill');
    const from=editing?.rentFrom||editing?.rentFromMonth||monthStart(received.value),till=editing?.rentTill||editing?.rentTillMonth||monthEnd(received.value);
    if(fs){fs.type='date';fs.value=from;fs.previousElementSibling.textContent='Rent Period — From';}
    if(ft){ft.type='date';ft.value=till;ft.previousElementSibling.textContent='Rent Period — Valid Till';}
    fillAccounts();
    if(editing)document.getElementById('pReceivedIn').value=editing.receivedIn||'';
    const shot=document.getElementById('pShot');if(shot)shot.value='';
    const st=document.getElementById('ocrStatus');if(st)st.textContent=editing?'Edit the payment details and save. No new receipt will be created.':'Upload a UPI/bank screenshot to extract payment details. Verify extracted details before saving.';
    const title=document.querySelector('#paymentModal .modalhead h3');if(title)title.textContent=editing?'Edit Payment':'Record Payment & Generate Receipt';
    const save=document.querySelector('#paymentModal .modalactions .btn.primary');if(save)save.textContent=editing?'Save Changes':'Save & Generate Receipt';
    document.getElementById('paymentModal').dataset.editPaymentId=editing?paymentId:'';
  };

  window.savePayment=function(){
    const modal=document.getElementById('paymentModal'),editingId=modal.dataset.editPaymentId||'';
    const x=rental(document.getElementById('pRental').value),amount=Number(document.getElementById('pAmount').value),date=document.getElementById('pDate').value,method=document.getElementById('pMethod').value,ref=document.getElementById('pRef').value.trim(),from=document.getElementById('pFrom').value,till=document.getElementById('pTill').value,receivedIn=document.getElementById('pReceivedIn').value;
    if(!x||!amount||!date)return toast('Enter tenant, amount and payment date.');
    if(!from||!till)return toast('Enter the exact rent period.');
    if(new Date(till+'T00:00:00')<new Date(from+'T00:00:00'))return toast('Valid Till cannot be before the rent period start.');
    if(editingId){
      const p=db.payments.find(a=>a.id===editingId);if(!p)return toast('Payment not found.');
      p.rentalId=x.id;p.date=date;p.amount=amount;p.method=method;p.ref=ref;p.receivedIn=receivedIn||null;p.rentFrom=from;p.rentTill=till;
      const r=db.receipts.find(a=>a.paymentId===p.id);if(r){r.rentalId=x.id;r.date=date;}
      closePayment();persist();if(r)openReceipt(r.id);toast('Payment updated.');return;
    }
    const previousDue=x.due,advancedDue=advanceDue(x);
    const pay={id:crypto.randomUUID(),rentalId:x.id,date,amount,method,ref,receivedIn:receivedIn||null,rentFrom:from,rentTill:till,previousDue,advancedDue};
    db.payments.push(pay);
    const rec={id:crypto.randomUUID(),number:'RCPT-'+new Date().getFullYear()+'-'+String(db.receipts.length+1).padStart(4,'0'),paymentId:pay.id,date,rentalId:x.id};
    db.receipts.push(rec);
    x.due=advancedDue;
    closePayment();persist();openReceipt(rec.id);toast('Payment saved and receipt created.');
  };

  window.editPayment=function(id){openPayment(null,id);};
  window.deletePayment=function(id){
    const p=db.payments.find(a=>a.id===id);if(!p)return;
    const r=db.receipts.find(a=>a.paymentId===id),x=rental(p.rentalId);
    if(!confirm(`Delete payment of ${money2(p.amount)} from ${fmt(p.date)}?\n\nThis will also delete receipt ${r?.number||''}.`))return;
    if(x&&p.previousDue&&x.due===p.advancedDue)x.due=p.previousDue;
    db.payments=db.payments.filter(a=>a.id!==id);db.receipts=db.receipts.filter(a=>a.paymentId!==id);
    persist();toast('Payment and receipt deleted.');
  };

  window.shareReceiptWhatsApp=function(id){
    const r=db.receipts.find(a=>a.id===id),p=db.payments.find(a=>a.id===r?.paymentId),x=rental(r?.rentalId);
    if(!r||!p||!x)return toast('Receipt not found.');
    const ns=(x.phone||'').split(/[\/,;]+/).map(v=>v.replace(/\D/g,'')).filter(Boolean);
    if(!ns.length)return toast('No WhatsApp number saved for this tenant.');
    let phone=ns[0];
    if(ns.length>1){const c=prompt('Select WhatsApp number:\n'+ns.map((n,i)=>(i+1)+'. '+n).join('\n'));const j=Number(c)-1;if(!ns[j])return;phone=ns[j];}
    const code=String(db.settings.code||'91').replace(/\D/g,'');
    if(phone.startsWith('0'))phone=phone.replace(/^0+/,'');
    if(phone.length===10&&!phone.startsWith(code))phone=code+phone;
    const msg=`Hello ${x.name||'Tenant'},\n\nPlease find your rent payment receipt details below.\n\nReceipt No.: ${r.number}\nPayment Received Date: ${fmt(p.date)}\nProperty: ${x.item}\nRent Period: ${fmt(p.rentFrom||p.rentFromMonth)} – ${fmt(p.rentTill||p.rentTillMonth)}\nPayment Type: ${p.method}\nTransaction ID / Reference: ${p.ref||'—'}\nReceived In: ${getAccountText(p)}\nAmount Received: ${money2(p.amount)}\n\nThank you,\n${db.settings.name||'MATANGI CORPORATION'}`;
    window.open('https://wa.me/'+phone+'?text='+encodeURIComponent(msg),'_blank');
  };

  window.openReceipt=function(id){
    const r=db.receipts.find(x=>x.id===id),p=db.payments.find(x=>x.id===r?.paymentId),x=rental(r?.rentalId);if(!r||!p||!x)return;
    const accountText=getAccountText(p);
    document.getElementById('receiptContent').innerHTML=`<div class="receipt"><h1>${esc(db.settings.name||'MATANGI CORPORATION')}</h1><div style="text-align:center;font-weight:800;letter-spacing:1px">RENT RECEIPT</div><div class="line"></div>
      <div class="receiptrow"><b>Receipt No.</b><span>${esc(r.number)}</span></div><div class="receiptrow"><b>Payment Received Date</b><span>${fmt(p.date)}</span></div><div class="receiptrow"><b>Tenant</b><span>${esc(x.name||'Tenant')}</span></div><div class="receiptrow"><b>Property</b><span>${esc(x.item)}</span></div><div class="line"></div>
      <div class="receiptrow"><b>Rent Period From</b><span>${fmt(p.rentFrom||p.rentFromMonth)}</span></div><div class="receiptrow"><b>Valid Till</b><span>${fmt(p.rentTill||p.rentTillMonth)}</span></div><div class="receiptrow"><b>Rent Period</b><span>${fmt(p.rentFrom||p.rentFromMonth)} – ${fmt(p.rentTill||p.rentTillMonth)}</span></div>
      <div class="receiptrow"><b>Payment Type</b><span>${esc(p.method)}</span></div><div class="receiptrow"><b>Transaction ID / Reference</b><span>${esc(p.ref||'—')}</span></div><div class="receiptrow"><b>Received In</b><span>${esc(accountText)}</span></div><div class="line"></div>
      <div class="receiptrow" style="font-size:20px"><b>Amount Received</b><b>${money2(p.amount)}</b></div><div class="line"></div><p style="color:#697386">${esc(db.settings.footer||'Thank you for your payment.')}</p></div>`;
    document.getElementById('receiptModal').classList.add('open');
    const actions=document.querySelector('#receiptModal .modalactions');if(actions&&!document.getElementById('receiptWhatsappBtn')){const b=document.createElement('button');b.id='receiptWhatsappBtn';b.className='btn green';b.textContent='WhatsApp Receipt';b.onclick=()=>shareReceiptWhatsApp(id);actions.insertBefore(b,actions.firstChild);}
  };

  window.renderPayments=function(){
    const el=document.getElementById('paymentTable');if(!el)return;
    el.innerHTML=db.payments.slice().reverse().map(p=>{let x=rental(p.rentalId),rec=db.receipts.find(r=>r.paymentId===p.id);return `<tr><td>${fmt(p.date)}</td><td>${esc(x?.name||'Deleted renter')}</td><td>${esc(x?.item||'')}</td><td>${money2(p.amount)}</td><td>${esc(p.method)}</td><td>${fmt(p.rentFrom||p.rentFromMonth)} – ${fmt(p.rentTill||p.rentTillMonth)}</td><td>${rec?`<button class="btn" onclick="openReceipt('${rec.id}')">${rec.number}</button>`:''}</td><td><button class="btn" onclick="editPayment('${p.id}')">Edit</button> <button class="btn danger" onclick="deletePayment('${p.id}')">Delete</button></td></tr>`}).join('')||'<tr><td colspan="8" class="empty">No payments recorded.</td></tr>';
    const head=el.closest('table')?.querySelector('thead tr');if(head&&head.children.length===7){const th=document.createElement('th');th.textContent='Actions';head.appendChild(th);}
  };

  window.renderReceipts=function(){
    const el=document.getElementById('receiptTable');if(!el)return;
    el.innerHTML=db.receipts.slice().reverse().map(r=>{let p=db.payments.find(a=>a.id===r.paymentId),x=rental(r.rentalId);return `<tr><td>${esc(r.number)}</td><td>${fmt(r.date)}</td><td>${esc(x?.name||'Deleted renter')}</td><td>${money2(p?.amount)}</td><td><button class="btn" onclick="openReceipt('${r.id}')">View</button> <button class="btn green" onclick="shareReceiptWhatsApp('${r.id}')">WhatsApp</button> <button class="btn danger" onclick="deletePayment('${p?.id||''}')">Delete</button></td></tr>`}).join('')||'<tr><td colspan="5" class="empty">No receipts yet.</td></tr>';
  };

  window.exportExcel=function(){
    if(typeof XLSX==='undefined')return toast('Excel library is not loaded.');
    let wb=XLSX.utils.book_new();
    let rs=db.rentals.map(x=>({ID:x.id,Renter:x.name,WhatsApp:x.phone,Property:x.item,Rent:x.rent,Deposit:x.deposit,NextDue:x.due,JoiningDate:x.start,Type:x.notes}));
    let ps=db.payments.map(p=>{let x=rental(p.rentalId),a=getAccounts().find(z=>z.id===p.receivedIn);return {Date:p.date,Renter:x?.name||'',Property:x?.item||'',Amount:p.amount,PaymentType:p.method,TransactionID:p.ref||'',ReceivedIn:a?(a.name+(a.last?' ****'+a.last.slice(-4):'')):p.receivedIn||'',RentPeriodFrom:p.rentFrom||p.rentFromMonth||'',RentValidTill:p.rentTill||p.rentTillMonth||''}});
    let recs=db.receipts.map(r=>{let p=db.payments.find(x=>x.id===r.paymentId),x=rental(r.rentalId);return {ReceiptNo:r.number,PaymentReceivedDate:r.date,Renter:x?.name||'',Property:x?.item||'',Amount:p?.amount||0,PaymentType:p?.method||'',TransactionID:p?.ref||'',RentPeriodFrom:p?.rentFrom||p?.rentFromMonth||'',RentValidTill:p?.rentTill||p?.rentTillMonth||''}});
    XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rs),'Rentals');XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(ps),'Payments');XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(recs),'Receipts');XLSX.writeFile(wb,'MATANGI-CORPORATION-Rental-Data.xlsx');toast('Excel file exported.');
  };

  function upgradeUI(){
    const fs=document.getElementById('pFrom'),ft=document.getElementById('pTill');
    if(fs){fs.type='date';fs.previousElementSibling.textContent='Rent Period — From';}
    if(ft){ft.type='date';ft.previousElementSibling.textContent='Rent Period — Valid Till';}
    fillAccounts();
    const a=Array.isArray(db.settings?.accounts)?db.settings.accounts:[];
    for(let i=1;i<=4;i++){const n=document.getElementById('a'+i+'name'),l=document.getElementById('a'+i+'last');if(n)n.value=a[i-1]?.name||'';if(l)l.value=a[i-1]?.last||'';}
    const head=document.querySelector('#paymentTable')?.closest('table')?.querySelector('thead tr');
    if(head&&head.children.length===7){const th=document.createElement('th');th.textContent='Actions';head.appendChild(th);}
    const title=document.querySelector('#paymentModal .modalhead h3');if(title)title.textContent='Record Payment & Generate Receipt';
    renderPayments();renderReceipts();
  }
  setTimeout(upgradeUI,100);
})();
