/* RentFlow payment/receipt enhancements: exact rent-period dates and account-aware receipts. */
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
  function fillAccounts(){
    const sel=document.getElementById('pReceivedIn'); if(!sel)return;
    const old=sel.value; const method=document.getElementById('pMethod')?.value;
    sel.innerHTML='<option value="">Not identified / Cash</option>';
    getAccounts().forEach(a=>{const o=document.createElement('option');o.value=a.id;o.textContent=a.name+(a.last?' — ****'+a.last.slice(-4):'');sel.appendChild(o)});
    if(old)sel.value=old;
    if(method==='Cash')sel.value='';
  }
  window.methodChanged=(function(orig){return function(){if(typeof orig==='function')orig();fillAccounts();};})(window.methodChanged);

  window.openPayment=function(id){
    document.getElementById('paymentModal').classList.add('open');
    const sel=document.getElementById('pRental');
    sel.innerHTML=db.rentals.map(x=>`<option value="${x.id}">${esc(x.name||'Vacant')} — ${esc(x.item)}</option>`).join('');
    sel.value=id||db.rentals[0]?.id||'';
    const x=rental(sel.value), received=document.getElementById('pDate');
    document.getElementById('pAmount').value=x?.rent||'';
    received.value=today();
    document.getElementById('pRef').value='';
    document.getElementById('pMethod').value='Cash';
    const fs=document.getElementById('pFrom'), ft=document.getElementById('pTill');
    if(fs){fs.type='date';fs.value=monthStart(received.value);fs.previousElementSibling.textContent='Rent Period — From';}
    if(ft){ft.type='date';ft.value=monthEnd(received.value);ft.previousElementSibling.textContent='Rent Period — Valid Till';}
    fillAccounts();
    const shot=document.getElementById('pShot');if(shot)shot.value='';
    const st=document.getElementById('ocrStatus');if(st)st.textContent='Upload a UPI/bank screenshot to extract payment details. Verify extracted details before saving.';
  };

  window.savePayment=function(){
    const x=rental(document.getElementById('pRental').value);
    const amount=Number(document.getElementById('pAmount').value);
    const date=document.getElementById('pDate').value;
    const method=document.getElementById('pMethod').value;
    const ref=document.getElementById('pRef').value.trim();
    const from=document.getElementById('pFrom').value;
    const till=document.getElementById('pTill').value;
    const receivedIn=document.getElementById('pReceivedIn').value;
    if(!x||!amount||!date)return toast('Enter tenant, amount and payment date.');
    if(!from||!till)return toast('Enter the exact rent period.');
    if(new Date(till+'T00:00:00')<new Date(from+'T00:00:00'))return toast('Valid Till cannot be before the rent period start.');
    const pay={id:crypto.randomUUID(),rentalId:x.id,date,amount,method,ref,receivedIn,rentFrom:from,rentTill:till};
    db.payments.push(pay);
    const rec={id:crypto.randomUUID(),number:'RCPT-'+new Date().getFullYear()+'-'+String(db.receipts.length+1).padStart(4,'0'),paymentId:pay.id,date,rentalId:x.id};
    db.receipts.push(rec);
    const d=new Date(x.due+'T00:00:00');
    if(x.cycle==='weekly')d.setDate(d.getDate()+7);else if(x.cycle==='daily')d.setDate(d.getDate()+1);else d.setMonth(d.getMonth()+1);
    x.due=d.toISOString().slice(0,10);
    closePayment();persist();openReceipt(rec.id);toast('Payment saved and receipt created.');
  };

  window.openReceipt=function(id){
    const r=db.receipts.find(x=>x.id===id),p=db.payments.find(x=>x.id===r?.paymentId),x=rental(r?.rentalId);if(!r||!p||!x)return;
    const account=getAccounts().find(a=>a.id===p.receivedIn);
    const accountText=account?(account.name+(account.last?' — ****'+account.last.slice(-4):'')):(p.receivedIn||'Not identified / Cash');
    document.getElementById('receiptContent').innerHTML=`<div class="receipt"><h1>${esc(db.settings.name||'MATANGI CORPORATION')}</h1><div style="text-align:center;font-weight:800;letter-spacing:1px">RENT RECEIPT</div><div class="line"></div>
      <div class="receiptrow"><b>Receipt No.</b><span>${esc(r.number)}</span></div>
      <div class="receiptrow"><b>Payment Received Date</b><span>${fmt(p.date)}</span></div>
      <div class="receiptrow"><b>Tenant</b><span>${esc(x.name||'Tenant')}</span></div>
      <div class="receiptrow"><b>Property</b><span>${esc(x.item)}</span></div>
      <div class="line"></div>
      <div class="receiptrow"><b>Rent Period From</b><span>${fmt(p.rentFrom)}</span></div>
      <div class="receiptrow"><b>Valid Till</b><span>${fmt(p.rentTill)}</span></div>
      <div class="receiptrow"><b>Rent Period</b><span>${fmt(p.rentFrom)} – ${fmt(p.rentTill)}</span></div>
      <div class="receiptrow"><b>Payment Type</b><span>${esc(p.method)}</span></div>
      <div class="receiptrow"><b>Transaction ID / Reference</b><span>${esc(p.ref||'—')}</span></div>
      <div class="receiptrow"><b>Received In</b><span>${esc(accountText)}</span></div>
      <div class="line"></div><div class="receiptrow" style="font-size:20px"><b>Amount Received</b><b>${money2(p.amount)}</b></div><div class="line"></div>
      <p style="color:#697386">${esc(db.settings.footer||'Thank you for your payment.')}</p></div>`;
    document.getElementById('receiptModal').classList.add('open');
  };

  window.renderPayments=function(){
    const el=document.getElementById('paymentTable'); if(!el)return;
    el.innerHTML=db.payments.slice().reverse().map(p=>{let x=rental(p.rentalId),rec=db.receipts.find(r=>r.paymentId===p.id);return `<tr><td>${fmt(p.date)}</td><td>${esc(x?.name||'Deleted renter')}</td><td>${esc(x?.item||'')}</td><td>${money2(p.amount)}</td><td>${esc(p.method)}</td><td>${fmt(p.rentFrom)} – ${fmt(p.rentTill)}</td><td>${rec?`<button class="btn" onclick="openReceipt('${rec.id}')">${rec.number}</button>`:''}</td></tr>`}).join('')||'<tr><td colspan="7" class="empty">No payments recorded.</td></tr>';
  };

  window.exportExcel=function(){
    if(typeof XLSX==='undefined')return toast('Excel library is not loaded.');
    let wb=XLSX.utils.book_new();
    let rs=db.rentals.map(x=>({ID:x.id,Renter:x.name,WhatsApp:x.phone,Property:x.item,Rent:x.rent,Deposit:x.deposit,NextDue:x.due,JoiningDate:x.start,Type:x.notes}));
    let ps=db.payments.map(p=>{let x=rental(p.rentalId),a=getAccounts().find(z=>z.id===p.receivedIn);return {Date:p.date,Renter:x?.name||'',Property:x?.item||'',Amount:p.amount,PaymentType:p.method,TransactionID:p.ref||'',ReceivedIn:a?(a.name+(a.last?' ****'+a.last.slice(-4):'')):p.receivedIn||'',RentPeriodFrom:p.rentFrom||'',RentValidTill:p.rentTill||''}});
    let recs=db.receipts.map(r=>{let p=db.payments.find(x=>x.id===r.paymentId),x=rental(r.rentalId);return {ReceiptNo:r.number,PaymentReceivedDate:r.date,Renter:x?.name||'',Property:x?.item||'',Amount:p?.amount||0,PaymentType:p?.method||'',TransactionID:p?.ref||'',RentPeriodFrom:p?.rentFrom||'',RentValidTill:p?.rentTill||''}});
    XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rs),'Rentals');XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(ps),'Payments');XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(recs),'Receipts');XLSX.writeFile(wb,'MATANGI-CORPORATION-Rental-Data.xlsx');toast('Excel file exported.');
  };

  function upgradeUI(){
    const fs=document.getElementById('pFrom'),ft=document.getElementById('pTill');
    if(fs){fs.type='date';fs.previousElementSibling.textContent='Rent Period — From';}
    if(ft){ft.type='date';ft.previousElementSibling.textContent='Rent Period — Valid Till';}
    fillAccounts();
    const a=Array.isArray(db.settings?.accounts)?db.settings.accounts:[];
    for(let i=1;i<=4;i++){const n=document.getElementById('a'+i+'name'),l=document.getElementById('a'+i+'last');if(n)n.value=a[i-1]?.name||'';if(l)l.value=a[i-1]?.last||'';}
  }
  setTimeout(upgradeUI,100);
})();
