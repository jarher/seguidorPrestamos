(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))r(a);new MutationObserver(a=>{for(const s of a)if(s.type==="childList")for(const n of s.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&r(n)}).observe(document,{childList:!0,subtree:!0});function t(a){const s={};return a.integrity&&(s.integrity=a.integrity),a.referrerPolicy&&(s.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?s.credentials="include":a.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function r(a){if(a.ep)return;a.ep=!0;const s=t(a);fetch(a.href,s)}})();const Y=(c,e,t,r)=>{const a=e/100,s=c/t;let n=c;const i=[],d=new Date(r);for(let o=1;o<=t;o++){const l=n*a,u=s+l;n-=s;const p=Math.max(0,n);d.setMonth(d.getMonth()+1),i.push({installmentNumber:o,date:new Date(d).toISOString().split("T")[0],principalPayment:Math.round(s*100)/100,interestPayment:Math.round(l*100)/100,totalPayment:Math.round(u*100)/100,remainingBalance:Math.round(p*100)/100,status:"pendiente"})}return i},Q=(c,e,t,r)=>{const a=e/100,s=c*a,n=c/t,i=n+s;let d=c;const o=[],l=new Date(r);for(let u=1;u<=t;u++){d-=n;const p=Math.max(0,d);l.setMonth(l.getMonth()+1),o.push({installmentNumber:u,date:new Date(l).toISOString().split("T")[0],principalPayment:Math.round(n*100)/100,interestPayment:Math.round(s*100)/100,totalPayment:Math.round(i*100)/100,remainingBalance:Math.round(p*100)/100,status:"pendiente"})}return o},g=c=>new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",minimumFractionDigits:0}).format(c),K=c=>{const e=JSON.parse(JSON.stringify(c.schedule||[])),t=c.paymentsHistory||[];let r=t.reduce((n,i)=>n+(parseFloat(i.capital)||0),0),a=t.reduce((n,i)=>n+(parseFloat(i.interest)||0),0);const s=new Date;s.setHours(0,0,0,0);for(let n=0;n<e.length;n++){const i=e[n],d=.01,o=parseFloat(i.principalPayment),l=parseFloat(i.interestPayment);let u=!1,p=!1;if(r>=o-d?(r-=o,u=!0):r=0,a>=l-d?(a-=l,p=!0):a=0,u&&p)i.status="pagada";else{const m=new Date(i.date);m.setHours(0,0,0,0),m<s?i.status="mora":i.status="pendiente"}}return e};function X(){return localStorage.getItem("lender_access_token")}async function f(c,e={}){const t=new Headers(e.headers||{});t.set("Content-Type","application/json");const r=X();r&&t.set("Authorization",`Bearer ${r}`);const a=await fetch(c,{...e,headers:t}),i=(a.headers.get("content-type")||"").includes("application/json")?await a.json().catch(()=>null):null;if(!a.ok){const d=(i==null?void 0:i.error)||`Error HTTP ${a.status}`,o=new Error(d);throw o.status=a.status,o.data=i,o}return i}const $="lender_access_token",k="lender_refresh_token",R="lender_user";function A(){const c=localStorage.getItem($),e=localStorage.getItem(k),t=JSON.parse(localStorage.getItem(R)||"null");return{token:c,refreshToken:e,user:t}}function U({token:c,refreshToken:e,user:t}){c&&localStorage.setItem($,c),e&&localStorage.setItem(k,e),t&&localStorage.setItem(R,JSON.stringify(t))}function Z(){localStorage.removeItem($),localStorage.removeItem(k),localStorage.removeItem(R)}async function ee({email:c,password:e,fullName:t}){const r=await f("/api/auth/register",{method:"POST",body:JSON.stringify({email:c,password:e,fullName:t})});return U({token:r.token,refreshToken:r.refreshToken,user:r.user}),r}async function te({email:c,password:e}){const t=await f("/api/auth/login",{method:"POST",body:JSON.stringify({email:c,password:e})});return U({token:t.token,refreshToken:t.refreshToken,user:t.user}),t}async function ae(){const c=A();try{await f("/api/auth/logout",{method:"POST",body:JSON.stringify({refreshToken:c.refreshToken})})}catch{}finally{Z()}}const q="lender_loans_cache",N="lender_loans_cache_expiry";class se{constructor(){this.state={loans:[],session:A(),settings:{theme:"dark",currency:"COP"},isLoading:!1,lastSync:null,syncError:null,showLogoutModal:!1},this.listeners=[],this.pendingActions=[]}isAuthenticated(){var e;return!!((e=this.state.session)!=null&&e.token)}setSession(e){this.state.session=e,this.listeners.forEach(t=>t(this.state))}clearSession(){this.state.session={token:null,refreshToken:null,user:null},this.state.loans=[],this.state.lastSync=null,localStorage.removeItem(q),localStorage.removeItem(N),this.listeners.forEach(e=>e(this.state))}async loadLoansFromApi(){if(this.isAuthenticated()){this.state.isLoading=!0,this.state.syncError=null,this.notifyListeners();try{const e=await f("/api/loans",{method:"GET"});this.state.loans=e.loans||[],this.state.lastSync=Date.now(),this.state.syncError=null,this.updateCache(this.state.loans)}catch(e){console.error("Failed to load loans from API:",e),this.state.syncError=e.message;const t=this.loadFromCache();t&&(this.state.loans=t,console.warn("Using stale cache due to API error"))}finally{this.state.isLoading=!1,this.notifyListeners()}}}updateCache(e){try{localStorage.setItem(q,JSON.stringify(e)),localStorage.setItem(N,Date.now().toString())}catch(t){console.warn("Failed to update loans cache:",t)}}loadFromCache(){try{const e=localStorage.getItem(q),t=localStorage.getItem(N);return!e||!t||Date.now()-parseInt(t,10)>CACHE_TTL?null:JSON.parse(e)}catch{return null}}getState(){const e=this.state.loans.map(t=>({...t,schedule:K(t)}));return{...this.state,loans:e}}notifyListeners(){this.listeners.forEach(e=>e(this.state))}subscribe(e){return this.listeners.push(e),()=>{this.listeners=this.listeners.filter(t=>t!==e)}}async dispatch(e){switch(e.type){case"ADD_LOAN":await this.addLoan(e.payload);break;case"DELETE_LOAN":await this.deleteLoan(e.payload);break;case"UPDATE_LOAN":await this.updateLoan(e.payload);break;case"RECORD_PAYMENT":await this.recordPayment(e.payload);break;case"UPDATE_LOAN_STATUS":await this.updateLoanStatus(e.payload);break;case"REFRESH":await this.loadLoansFromApi();break}}async addLoan(e){this.state.isLoading=!0,this.notifyListeners();try{const t=await f("/api/loans",{method:"POST",body:JSON.stringify({loan:e})});this.state.loans.push(t.loan),this.updateCache(this.state.loans)}catch(t){throw console.error("Failed to add loan:",t),this.state.syncError=t.message,this.notifyListeners(),t}finally{this.state.isLoading=!1,this.notifyListeners()}}async deleteLoan(e){this.state.isLoading=!0,this.notifyListeners();try{await f(`/api/loans/${encodeURIComponent(e)}`,{method:"DELETE"}),this.state.loans=this.state.loans.filter(t=>t.id!==e),this.updateCache(this.state.loans)}catch(t){throw console.error("Failed to delete loan:",t),this.state.syncError=t.message,this.notifyListeners(),t}finally{this.state.isLoading=!1,this.notifyListeners()}}async updateLoan(e){const{id:t,...r}=e;this.state.isLoading=!0,this.notifyListeners();try{const a=await f(`/api/loans/${encodeURIComponent(t)}`,{method:"PUT",body:JSON.stringify({updates:r})});this.state.loans=this.state.loans.map(s=>s.id===t?{...s,...a.loan}:s),this.updateCache(this.state.loans)}catch(a){throw console.error("Failed to update loan:",a),this.state.syncError=a.message,this.notifyListeners(),a}finally{this.state.isLoading=!1,this.notifyListeners()}}async recordPayment(e){const{loanId:t,payment:r,nextDeadline:a}=e;this.state.isLoading=!0,this.notifyListeners();try{const s=await f(`/api/loans/${encodeURIComponent(t)}`,{method:"PUT",body:JSON.stringify({updates:{$push:{paymentsHistory:r},...a&&{deadlineDate:a}}})});this.state.loans=this.state.loans.map(n=>{if(n.id===t){const i=[...n.paymentsHistory||[],r];return{...n,paymentsHistory:i,...a&&{deadlineDate:a}}}return n}),this.updateCache(this.state.loans)}catch(s){throw console.error("Failed to record payment:",s),this.state.syncError=s.message,this.notifyListeners(),s}finally{this.state.isLoading=!1,this.notifyListeners()}}async updateLoanStatus(e){const{id:t,status:r}=e;this.state.isLoading=!0,this.notifyListeners();try{await f(`/api/loans/${encodeURIComponent(t)}`,{method:"PUT",body:JSON.stringify({updates:{status:r}})}),this.state.loans=this.state.loans.map(a=>a.id===t?{...a,status:r}:a),this.updateCache(this.state.loans)}catch(a){throw console.error("Failed to update loan status:",a),this.state.syncError=a.message,this.notifyListeners(),a}finally{this.state.isLoading=!1,this.notifyListeners()}}async migrateLocalLoansToApiIfNeeded(){if(!this.isAuthenticated())return{migrated:0};const e="lender_loans",t=localStorage.getItem(e);if(!t)return{migrated:0};try{const r=await f("/api/loans",{method:"GET"});if(Array.isArray(r.loans)&&r.loans.length>0)return localStorage.removeItem(e),{migrated:0};const a=JSON.parse(t);if(!Array.isArray(a)||a.length===0)return localStorage.removeItem(e),{migrated:0};const s=await f("/api/loans/import",{method:"POST",body:JSON.stringify({loans:a})});return localStorage.removeItem(e),await this.loadLoansFromApi(),{migrated:s.imported||a.length}}catch(r){return console.error("Migration failed:",r),{migrated:0,error:r.message}}}setLogoutModal(e){this.state.showLogoutModal=e,this.notifyListeners()}}const h=new se;class re extends HTMLElement{constructor(){super(),this.render()}connectedCallback(){this.unsubscribe=h.subscribe(()=>this.render()),this.render()}disconnectedCallback(){this.unsubscribe&&this.unsubscribe()}render(){var o;const e=h.getState().session||A(),t=!!(e!=null&&e.token),r=((o=e==null?void 0:e.user)==null?void 0:o.fullName)||"Usuario",a=DOMPurify.sanitize(r,{ALLOWED_TAGS:[],ALLOWED_ATTR:[]}),s=a.split(" ").filter(Boolean).slice(0,2).map(l=>l[0].toUpperCase()).join("")||"U";this.innerHTML=`
            <nav class="sidebar glass">
                <div class="logo">
                    <img src="favicon.png" alt="Lender's HQ logo">
                    <span class="logo-text">Lender's HQ</span>
                </div>
                <ul class="nav-links" style="${t?"":"display:none"}">
                    <li class="active" data-view="dashboard">
                        <span class="icon">📊</span>
                        <span class="text">Dashboard</span>
                    </li>
                    <li data-view="borrowers">
                        <span class="icon">👥</span>
                        <span class="text">Prestatarios</span>
                    </li>
                    <li data-view="loans">
                        <span class="icon">💸</span>
                        <span class="text">Préstamos</span>
                    </li>
                    <li data-view="new-loan">
                        <span class="icon">➕</span>
                        <span class="text">Nuevo Préstamo</span>
                    </li>
                </ul>
                <div class="user-profile">
                    <div class="user-info-section">
                        <div class="avatar">${s}</div>
                        <div class="user-info">
                            <p class="name">${t?a:"Invitado"}</p>
                            <p class="role">${t?"Sesión activa":"Inicia sesión"}</p>
                        </div>
                    </div>
                    <div class="user-profile__actions">        
                        <button id="theme-toggle" class="btn-theme-toggle" title="Cambiar tema">
                            <span class="material-icons">dark_mode</span>
                        </button>
                        ${t?'<button id="logout-btn" class="btn-theme-toggle" title="Cerrar sesión"><span class="material-icons">logout</span></button>':""}
                    </div>
                </div>
            </nav>
        `,this.querySelectorAll(".nav-links li").forEach(l=>{l.addEventListener("click",()=>{this.querySelectorAll(".nav-links li").forEach(p=>p.classList.remove("active")),l.classList.add("active");const u=l.getAttribute("data-view");window.dispatchEvent(new CustomEvent("view-change",{detail:u}))})});const n=this.querySelector("#theme-toggle"),i=()=>{const l=document.body.classList.contains("light-theme");n.querySelector(".material-icons").textContent=l?"light_mode":"dark_mode"};i(),n.addEventListener("click",()=>{document.body.classList.toggle("light-theme"),i();const l=document.body.classList.contains("light-theme")?"light":"dark";localStorage.setItem("lender_theme",l)}),localStorage.getItem("lender_theme")==="light"&&(document.body.classList.add("light-theme"),i());const d=this.querySelector("#logout-btn");d&&d.addEventListener("click",()=>{h.setLogoutModal(!0),window.dispatchEvent(new CustomEvent("open-modal",{detail:"logout"}))}),this._viewChangeListener=l=>{const u=typeof l.detail=="string"?l.detail:l.detail.view;this._setActiveLink(u)},window.addEventListener("view-change",this._viewChangeListener)}_setActiveLink(e){this.querySelectorAll(".nav-links li").forEach(t=>{t.classList.toggle("active",t.getAttribute("data-view")===e)})}disconnectedCallback(){this.unsubscribe&&this.unsubscribe(),this._viewChangeListener&&window.removeEventListener("view-change",this._viewChangeListener)}}customElements.define("lender-nav",re);class _{static downloadCSV(e,t){const a=l=>{if(l==null)return"";let u=String(l);return(u.includes(";")||u.includes(`
`)||u.includes('"'))&&(u=`"${u.replace(/"/g,'""')}"`),u},n="\uFEFF"+e.map(l=>l.map(a).join(";")).join(`
`),i=new Blob([n],{type:"text/csv;charset=utf-8;"}),d=URL.createObjectURL(i),o=document.createElement("a");o.setAttribute("href",d),o.setAttribute("download",t),o.style.visibility="hidden",document.body.appendChild(o),o.click(),document.body.removeChild(o),URL.revokeObjectURL(d)}static generatePortfolioReport(e=[]){const t=["Referencia","Prestatario","Email","Telefono","Monto Prestado","Interes (%)","Estado","Fecha Inicio","Capital Pagado","Intereses Pagados","Total Recaudado","Capital Pendiente"],r=e.map(a=>{const s=a.paymentsHistory||[],n=s.reduce((l,u)=>l+(parseFloat(u.interest)||0),0),i=s.reduce((l,u)=>l+(parseFloat(u.capital)||0),0),d=(parseFloat(a.amount)||0)-i,o=n+i;return[`#${a.referenceId||(a.id?a.id.slice(-6):"N/A")}`,a.borrowerName||"Sin Nombre",a.email||"",a.phone||"",a.amount||0,a.interest||0,(a.status||"Desconocido").toUpperCase(),a.startDate||"",i,n,o,d]});this.downloadCSV([t,...r],`Reporte_Cartera_${new Date().toISOString().split("T")[0]}.csv`)}static generateBorrowerHistoryReport(e){if(!e)return;const t=["Fecha","Concepto","Abono Capital","Abono Interes","Total Transaccion"],r=e.paymentsHistory||[],a=r.map(o=>[o.date||"","Pago registrado",parseFloat(o.capital)||0,parseFloat(o.interest)||0,(parseFloat(o.capital)||0)+(parseFloat(o.interest)||0)]),s=r.reduce((o,l)=>o+(parseFloat(l.interest)||0),0),n=r.reduce((o,l)=>o+(parseFloat(l.capital)||0),0),i=(parseFloat(e.amount)||0)-n,d=[[],["RESUMEN FINANCIERO","","","",""],["Total Prestado",e.amount||0,"","",""],["Tasa de Interes",`${e.interest||0}%`,"","",""],["Capital Ya Recaudado",n,"","",""],["Intereses Ya Recaudados",s,"","",""],["Total Cobrado a la fecha",n+s,"","",""],["Saldo Pendiente de Capital",i,"","",""]];this.downloadCSV([["ESTADO DE CUENTA INDIVIDUAL","","","",""],["Prestatario",e.borrowerName||"Sin Nombre","","",""],["Referencia",`#${e.referenceId||(e.id?e.id.slice(-6):"N/A")}`,"","",""],["Fecha de Generacion",new Date().toLocaleString(),"","",""],[],t,...a,...d],`Reporte_${(e.borrowerName||"cliente").replace(/\s+/g,"_")}_${new Date().toISOString().split("T")[0]}.csv`)}static generateBorrowerComprehensiveReport(e,t){if(!e)return;const r=t.filter(d=>d.borrowerName===e);if(r.length===0)return;const a=["Referencia","Monto Prestado","Intereses Pagados","Capital Pagado","Estado"],s=r.map(d=>{const o=d.paymentsHistory||[],l=o.reduce((m,v)=>m+(parseFloat(v.interest)||0),0),u=o.reduce((m,v)=>m+(parseFloat(v.capital)||0),0);let p="ACTIVO";return d.status==="completed"&&(p="PAGADO"),d.status==="mora"&&(p="EN MORA"),[`#${d.referenceId||(d.id?d.id.slice(-6):"N/A")}`,d.amount||0,l,u,p]}),n=r.reduce((d,o)=>d+(parseFloat(o.amount)||0),0),i=r.reduce((d,o)=>d+(o.paymentsHistory||[]).reduce((l,u)=>l+(parseFloat(u.interest)||0),0),0);this.downloadCSV([["REPORTE HISTORICO DEL PRESTATARIO",""],["NOMBRE DEL PRESTATARIO",e],["FECHA GENERACION",new Date().toLocaleString()],[],a,...s,[],["TOTALES GENERALES",n,i,"",""]],`Reporte_Historial_${e.replace(/\s+/g,"_")}.csv`)}}class ie extends HTMLElement{constructor(){super(),this.innerHTML=`
            <div class="dashboard-wrapper">
                <header class="view-header">
                    <div class="view-header-content">
                        <h1>Resumen del Portafolio</h1>
                        <p>Rendimiento en tiempo real de tu capital gestionado.</p>
                    </div>
                    <div class="dashboard-actions">
                        <button class="btn btn-primary" id="add-loan-btn">+ Nuevo Préstamo</button>
                        <button class="btn btn-secondary" id="generate-report-btn">Generar Reporte</button>
                    </div>
                </header>
                <div class="stats-grid">
                    <div class="stat-card glass">
                        <div class="stat-header">
                            <span class="icon">💰</span>
                            <span class="trend positive">+12% vs mes pasado</span>
                        </div>
                        <div class="stat-value" id="total-capital">$0</div>
                        <div class="stat-label">Capital Total Prestado</div>
                    </div>
                    <div class="stat-card glass border-green">
                        <div class="stat-header">
                            <span class="icon">📈</span>
                            <span class="trend positive">100% saludable</span>
                        </div>
                        <div class="stat-value" id="total-interest">$0</div>
                        <div class="stat-label">Intereses Ganados (YTD)</div>
                    </div>
                    <div class="stat-card glass border-orange">
                        <div class="stat-header">
                            <span class="icon">⚠️</span>
                            <span class="trend negative">0 Cobros Pendientes</span>
                        </div>
                        <div class="stat-value" id="total-arrears">$0</div>
                        <div class="stat-label">Capital en Mora</div>
                    </div>
                </div>

                <div class="stats-grid">
                  <section class="upcoming-week-section">
                      <div class="section-header">
                          <h2>📆 Próximos 7 Días</h2>
                      </div>
                      <div class="due-today-grid" id="upcoming-week-list">
                          <p class="empty-msg">No hay cobros programados para esta semana.</p>
                      </div>
                  </section>

                  <section class="due-today-section">
                      <div class="section-header">
                          <h2>📅 Cobros para Hoy</h2>
                          <span class="badge priority">PRIORIDAD</span>
                      </div>
                      <div class="due-today-grid" id="due-today-list">
                          <!-- Se llenará dinámicamente -->
                          <p class="empty-msg">No hay cobros programados para hoy.</p>
                      </div>
                  </section>
                </div>
            </div>
        `}connectedCallback(){this.updateStats(),this.querySelector("#add-loan-btn").addEventListener("click",()=>{window.dispatchEvent(new CustomEvent("view-change",{detail:"new-loan"}))}),this.querySelector("#generate-report-btn").addEventListener("click",()=>{const{loans:e}=h.getState();_.generatePortfolioReport(e)}),h.subscribe(()=>this.updateStats())}updateStats(){const{loans:e}=h.getState(),t=e.reduce((a,s)=>a+s.amount,0),r=e.reduce((a,s)=>a+s.amount*(s.interest/100),0);this.querySelector("#total-capital").textContent=g(t),this.querySelector("#total-interest").textContent=g(r),this.updateDueToday(e),this.updateUpcomingWeek(e)}updateUpcomingWeek(e){const t=new Date;t.setHours(0,0,0,0);const r=new Date(t);r.setDate(r.getDate()+7);const a=[];e.forEach(i=>{(i.schedule||[]).forEach(d=>{if(d.status==="pendiente"){const o=new Date(d.date);if(o>t&&o<=r){const l=Math.ceil((o-t)/864e5);a.push({borrower:i.borrowerName,amount:d.totalPayment,date:d.date,daysUntil:l,loanId:i.id})}}})});const s=a.sort((i,d)=>new Date(i.date)-new Date(d.date)),n=this.querySelector("#upcoming-week-list");if(s.length===0){n.innerHTML=`
                <div class="empty-state-container" style="padding: 1.5rem; margin: 0;">
                    <span class="empty-state-icon" style="font-size: 2rem;">📅</span>
                    <h3 class="empty-state-title" style="font-size: 0.9rem;">Sin cobros próximos</h3>
                    <p class="empty-state-msg" style="font-size: 0.8rem;">No hay cobros programados para los próximos 7 días.</p>
                </div>
            `;return}n.innerHTML=s.map(i=>{const d=DOMPurify.sanitize(i.borrower||"",{ALLOWED_TAGS:[],ALLOWED_ATTR:[]}),o=DOMPurify.sanitize(i.loanId||"",{ALLOWED_TAGS:[],ALLOWED_ATTR:[]}),l=new Date(i.date),u=l.toLocaleDateString("es-ES",{weekday:"short"}),p=l.getDate();return`
                <div class="due-card glass" data-loan-id="${o}">
                    <div class="due-info">
                        <h3>${d}</h3>
                        <p class="due-amount">${g(i.amount)}</p>
                        <p class="due-date">
                            <span class="day-badge">${u} ${p}</span>
                            <span class="days-label">${i.daysUntil===1?"Mañana":`En ${i.daysUntil} días`}</span>
                        </p>
                    </div>
                    <button class="btn btn-secondary btn-sm" data-loan-id="${o}">Ver</button>
                </div>
            `}).join("")}updateDueToday(e){const t=new Date().toISOString().split("T")[0],r=[];e.forEach(s=>{s.schedule.forEach(n=>{n.date===t&&!n.paid&&r.push({borrower:s.borrowerName,amount:n.totalPayment,installment:n.installmentNumber,totalInstallments:s.payments})})});const a=this.querySelector("#due-today-list");if(r.length===0){a.innerHTML=`
                <div class="empty-state-container" style="padding: 2rem; margin: 0;">
                    <span class="empty-state-icon" style="font-size: 2.5rem; margin-bottom: 0.5rem;">✅</span>
                    <h3 class="empty-state-title" style="font-size: 1rem;">¡Todo al día!</h3>
                    <p class="empty-state-msg" style="font-size: 0.85rem;">"No tienes cobros pendientes para hoy. Un portafolio ordenado es un portafolio próspero."</p>
                </div>
            `;return}a.innerHTML=r.map(s=>`
            <div class="due-card glass border-orange">
                <div class="due-info">
                    <h3>${DOMPurify.sanitize(s.borrower||"",{ALLOWED_TAGS:[],ALLOWED_ATTR:[]})}</h3>
                    <p class="due-amount">${g(s.amount)}</p>
                    <p class="due-installment">Cuota #${s.installment} de ${s.totalInstallments}</p>
                </div>
                <button class="btn btn-primary btn-sm">Cobrar</button>
            </div>
        `).join("")}}customElements.define("lender-dashboard",ie);class L{static show(e,t=null){const r=document.querySelector(".notification-panel");r&&r.remove();const a=document.createElement("div");a.className="notification-panel";const s=DOMPurify.sanitize(e,{ALLOWED_TAGS:[],ALLOWED_ATTR:[]});a.innerHTML=`
            <div class="notification-content">
                <div class="notification-text">${s}</div>
            </div>
            <div class="notification-progress"></div>
        `,document.body.appendChild(a),a.offsetWidth,a.classList.add("show"),setTimeout(()=>{a.classList.remove("show"),setTimeout(()=>{a.remove(),t&&t()},400)},3e3)}}const x=Object.freeze(Object.defineProperty({__proto__:null,NotificationPanel:L},Symbol.toStringTag,{value:"Module"}));class ne extends HTMLElement{constructor(){super(),this.innerHTML=`
            <div class="dashboard-wrapper">
                <header class="view-header">
                    <div class="view-header-content">
                        <h1>Registrar Nuevo Préstamo</h1>
                        <p>Ingresa los detalles del prestatario y las condiciones del crédito.</p>
                    </div>
                </header>

                <div class="form-container glass">
                    <form id="new-loan-form">
                        <div class="form-section">
                            <h3>Información del Prestatario</h3>
                            <lender-input 
                                id="borrower-name" 
                                label="Nombre Completo" 
                                placeholder="Ej. Juan Pérez" 
                                validator='{"required":true,"minlength":3}'
                                error-messages='{"required":"El nombre es requerido","minlength":"El nombre debe tener al menos 3 caracteres."}'>
                            </lender-input>
                            
                            <div class="form-grid">
                                <lender-input 
                                    id="borrower-email" 
                                    type="email" 
                                    label="Correo Electrónico" 
                                    placeholder="perez@ejemplo.com"
                                    validator='{"type":"email"}'
                                    error-messages='{"type":"Ingresa un correo válido."}'>
                                </lender-input>
                                <lender-input 
                                    id="borrower-phone" 
                                    type="tel" 
                                    label="Número de Teléfono" 
                                    placeholder="+57 300..."
                                    validator='{"type":"tel"}'
                                    error-messages='{"type":"Ingresa un teléfono válido."}'>
                                </lender-input>
                            </div>
                        </div>

                        <div class="form-section">
                            <h3>Condiciones del Préstamo</h3>
                            <div class="form-grid">
                                <lender-input 
                                    id="loan-amount" 
                                    type="text"
                                    label="Monto a Prestar" 
                                    placeholder="0.00" 
                                    validator='{"required":true,"type":"number","min":1}'
                                    error-messages='{"required":"El monto es requerido","type":"Ingresa un número válido","min":"El monto debe ser mayor a 0."}'>
                                </lender-input>
                                <lender-input 
                                    id="interest-rate" 
                                    type="text"
                                    label="Tasa de Interés (%)" 
                                    placeholder="3" 
                                    validator='{"type":"number","min":0}'
                                    error-messages='{"type":"Ingresa un número válido","min":"La tasa no puede ser negativa."}'>
                                </lender-input>
                            </div>

                            <div class="form-grid">
                                <lender-input 
                                    id="start-date" 
                                    type="date" 
                                    label="Fecha del Préstamo" 
                                    validator='{"required":true}'
                                    error-messages='{"required":"La fecha de inicio es requerida."}'>
                                </lender-input>
                                <lender-input 
                                    id="deadline-date" 
                                    type="date" 
                                    label="Fecha Límite de Pago"
                                    error-msg="La fecha límite debe ser posterior a la de inicio.">
                                </lender-input>
                            </div>
                        </div>

                        <div class="form-section">
                            <h3>Esquema de Préstamo</h3>
                            <div class="form-group" id="group-loan-scheme">
                                <label for="loan-scheme">Tipo de Esquema</label>
                                <select id="loan-scheme" class="glass-select">
                                    <option value="decreasing" selected>Cuota Decreciente</option>
                                    <option value="fixed">Cuota Fija</option>
                                    <option value="interest-free">Sin Intereses</option>
                                </select>
                                <span class="error-message">Selecciona un esquema válido.</span>
                            </div>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" id="back-btn">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Registrar Préstamo</button>
                        </div>
                    </form>
                </div>
            </div>
        `}connectedCallback(){this.querySelector("#new-loan-form").addEventListener("submit",e=>{e.preventDefault(),this.handleFormSubmit()}),this.querySelector("#back-btn").addEventListener("click",()=>{window.dispatchEvent(new CustomEvent("view-change",{detail:"dashboard"}))})}handleFormSubmit(){const e=this.querySelector("#borrower-name"),t=this.querySelector("#loan-amount"),r=this.querySelector("#interest-rate"),a=this.querySelector("#start-date"),s=this.querySelector("#deadline-date"),n=e.validate(),i=t.validate(),d=r.validate(),o=a.validate();let l=!0;if(s.value&&new Date(s.value)<=new Date(a.value)&&(s.setError("La fecha límite debe ser posterior a la de inicio."),l=!1),!n||!i||!d||!o||!l){L.show("Por favor corrige los campos marcados en rojo.");return}const u=e.value,p=this.querySelector("#borrower-email").value,m=this.querySelector("#borrower-phone").value,v=parseFloat(t.value.replace(/,/g,"")),b=this.querySelector("#loan-scheme").value,y=b==="interest-free"?0:parseFloat(r.value.replace(/,/g,""))||0,E=a.value,T=s.value,D=new Date(E),S=new Date(T),C=(S.getFullYear()-D.getFullYear())*12+(S.getMonth()-D.getMonth()),I=C>0?C:1;let O;b==="fixed"?O=Q(v,y,I,E):O=Y(v,y,I,E);const F=["#FF6B00","#A855F7","#06B6D4","#10B981","#F43F5E","#F59E0B"],V=F[Math.floor(Math.random()*F.length)],j="L-"+Math.floor(1e5+Math.random()*9e5),J={id:Date.now().toString(),referenceId:j,color:V,borrowerName:u,email:p,phone:m,amount:v,interest:y,startDate:E,deadlineDate:T,scheme:b,payments:I,schedule:O,paymentsHistory:[],status:"active",createdAt:new Date().toISOString()};h.dispatch({type:"ADD_LOAN",payload:J}),L.show("Préstamo registrado exitosamente",()=>{window.dispatchEvent(new CustomEvent("view-change",{detail:"dashboard"}))})}}customElements.define("new-loan-view",ne);const oe=["#FF6B00","#A855F7","#06B6D4","#10B981","#F43F5E","#F59E0B"];function G(c){if(!c||typeof c!="string")return 0;const e=c.trim().toUpperCase(),t=oe.findIndex(r=>r.toUpperCase()===e);return t>=0?t:0}class le extends HTMLElement{constructor(){super(),this.innerHTML=`
            <div class="dashboard-wrapper">
                <header class="view-header">
                    <div class="view-header-content">
                        <h1>Gestión de Prestatarios</h1>
                        <p>Lista detallada de clientes y estado de sus obligaciones.</p>
                    </div>
                </header>

                <div class="table-container glass" id="table-wrapper">
                    <table class="lender-table" id="data-table">
                        <thead>
                            <tr>
                                <th>Prestatario</th>
                                <th>Prestado</th>
                                <th>Balance Actual</th>
                                <th>Próximo Pago</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="borrowers-list">
                            <!-- Se llenará dinámicamente -->
                        </tbody>
                    </table>
                    <div id="empty-state" class="empty-state-hidden">
                        <div class="empty-state-container">
                            <span class="empty-state-icon">👥</span>
                            <h3 class="empty-state-title">Aún no hay prestatarios</h3>
                            <p class="empty-state-msg">"El éxito financiero comienza con el primer préstamo registrado. ¡Empieza hoy mismo a construir tu cartera!"</p>
                            <button class="btn btn-primary empty-add-btn" id="empty-add-btn">Registrar Primer Cliente</button>
                        </div>
                    </div>
                </div>
            </div>
        `}connectedCallback(){this.renderBorrowers(),h.subscribe(()=>this.renderBorrowers())}renderBorrowers(){const{loans:e}=h.getState(),t=this.querySelector("#borrowers-list"),r=this.querySelector("#empty-state");if(e.length===0){t.innerHTML="",r.classList.remove("empty-state-hidden"),this.querySelector("#data-table").classList.add("data-table-hidden");const a=this.querySelector("#empty-add-btn");a&&(a.onclick=()=>window.dispatchEvent(new CustomEvent("view-change",{detail:"new-loan"})));return}r.classList.add("empty-state-hidden"),this.querySelector("#data-table").classList.remove("data-table-hidden"),t.innerHTML=e.map(a=>{const s=(a.paymentsHistory||[]).reduce((m,v)=>m+(parseFloat(v.capital)||0),0),n=a.amount-s,i=a.schedule.find(m=>!m.paid),d=this.getStatusClass(a),o=this.getStatusLabel(a),l=DOMPurify.sanitize(a.borrowerName||"",{ALLOWED_TAGS:[],ALLOWED_ATTR:[]}),u=DOMPurify.sanitize(a.id||"",{ALLOWED_TAGS:[],ALLOWED_ATTR:[]});return`
                <tr>
                    <td data-label="Prestatario">
                        <div class="borrower-info">
                            <div class="avatar-sm borrower-avatar--${G(a.color)}">${l.charAt(0)}</div>
                            <span>${l}</span>
                        </div>
                    </td>
                    <td data-label="Prestado">${g(a.amount)}</td>
                    <td data-label="Balance Actual" class="font-bold">${g(n)}</td>
                    <td data-label="Próximo Pago">${i?i.date:"N/A"}</td>
                    <td data-label="Estado"><span class="badge ${d}">${o}</span></td>
                    <td data-label="Acciones">
                        <button class="btn-icon view-details-btn" data-id="${u}">
                            <span class="material-icons">visibility</span>
                        </button>
                    </td>
                </tr>
            `}).join(""),this.querySelectorAll(".view-details-btn").forEach(a=>{a.addEventListener("click",()=>{const s=a.getAttribute("data-id");window.dispatchEvent(new CustomEvent("view-change",{detail:{view:"borrower-detail",data:s}}))})})}getStatusClass(e){if(e.status==="mora")return"badge-danger";if(e.status==="completed")return"badge-success";const t=new Date().toISOString().split("T")[0];return(e.schedule||[]).some(a=>!a.paid&&a.date<t)?"badge-danger":"badge-warning"}getStatusLabel(e){if(e.status==="mora")return"MORA";if(e.status==="completed")return"PAGADO";const t=new Date().toISOString().split("T")[0];return(e.schedule||[]).some(a=>!a.paid&&a.date<t)?"MORA":"ACTIVO"}}customElements.define("borrowers-view",le);class de extends HTMLElement{constructor(){super(),this.borrowerId=null}static get observedAttributes(){return["borrower-id"]}attributeChangedCallback(e,t,r){e==="borrower-id"&&(this.borrowerId=r,this.render())}connectedCallback(){this.render(),h.subscribe(()=>this.render())}render(){if(!this.borrowerId)return;const{loans:e}=h.getState(),t=e.find(v=>v.id===this.borrowerId);if(!t){this.innerHTML='<div class="dashboard-wrapper"><h1>Prestatario no encontrado</h1></div>';return}const r=(t.paymentsHistory||[]).reduce((v,b)=>v+(parseFloat(b.capital)||0),0),a=(t.paymentsHistory||[]).reduce((v,b)=>v+(parseFloat(b.interest)||0),0),s=t.amount-r,n=Math.max(0,s/t.amount*100),i=G(t.color),d=this.getStatusLabel(t),o=this.getStatusClass(t),l=DOMPurify.sanitize(t.borrowerName||"",{ALLOWED_TAGS:[],ALLOWED_ATTR:[]}),u=DOMPurify.sanitize(t.email||"",{ALLOWED_TAGS:[],ALLOWED_ATTR:[]}),p=DOMPurify.sanitize(t.phone||"",{ALLOWED_TAGS:[],ALLOWED_ATTR:[]}),m=DOMPurify.sanitize(t.referenceId||t.id.slice(-6),{ALLOWED_TAGS:[],ALLOWED_ATTR:[]});this.innerHTML=`
            <div class="dashboard-wrapper">
                <!-- Header inspirado en el diseño -->
                <header class="profile-header">
                    <div class="profile-main">
                        <button class="btn-icon back-arrow" id="back-to-borrowers">
                            <span class="material-icons">arrow_back</span>
                        </button>
                        <div class="profile-avatar borrower-profile--${i}">
                            <div class="avatar-img borrower-profile--${i}">
                                ${l.charAt(0)}
                            </div>
                            <div class="status-indicator status-indicator--${t.status==="active"?"active":"mora"}"></div>
                        </div>
                        <div class="profile-info">
                            <div class="profile-title">
                                <h1>${l}</h1>
                                <span class="badge ${o}">${d}</span>
                            </div>
                            <p class="reference">ID DE PRÉSTAMO: <span class="ref-id">#${m}</span> • Activo desde ${new Date(t.startDate).toLocaleDateString("es-ES",{month:"short",year:"numeric"})}</p>
                        </div>
                    </div>
                    <div class="profile-actions">
                        <button class="btn btn-secondary"><span class="material-icons">email</span> Mensaje</button>
                        <button class="btn btn-primary btn-vivid"><span class="material-icons">flash_on</span> Acción Rápida</button>
                    </div>
                </header>

                <div class="profile-layout">
                    <div class="profile-main-content">
                        <!-- Stats Grid inspirado -->
                        <div class="stats-grid-vivid">
                            <div class="stat-card glass">
                                <div class="stat-header">
                                    <h3>Total Prestado</h3>
                                    <span class="stat-icon">💰</span>
                                </div>
                                <p class="stat-value">${g(t.amount)}</p>
                                <span class="stat-trend positive">↑ 12% sobre inicial</span>
                            </div>
                            <div class="stat-card glass accent-line" style="--accent-color: ${borrowerColor}">
                                <div class="stat-header">
                                    <h3>Interés Acumulado</h3>
                                </div>
                                <p class="stat-value vivid-text" style="color: ${borrowerColor}">${g(a)}</p>
                                <span class="stat-subtext">Tasa Fija del ${t.interest}%</span>
                            </div>
                            <div class="stat-card glass">
                                <div class="stat-header">
                                    <h3>Restante</h3>
                                </div>
                                <p class="stat-value">${g(s)}</p>
                                <div class="progress-container-vivid">
                                    <div class="progress-bar-vivid borrower-accent--${i}" style="width: ${100-n}%"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Historial de Pagos -->
                        <div class="glass card-history">
                            <div class="card-header-vivid">
                                <h3><span class="material-icons">history</span> Historial de Pagos</h3>
                                <button class="btn-text">VER TODO</button>
                            </div>
                            <div class="table-vivid-wrapper">
                                <table class="table-vivid">
                                    <thead>
                                        <tr>
                                            <th>FECHA</th>
                                            <th>DETALLE</th>
                                            <th>MONTO</th>
                                            <th>ESTADO</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${(t.paymentsHistory||[]).length===0?'<tr><td colspan="4" style="text-align:center; padding: 2rem;">No hay pagos registrados aún.</td></tr>':t.paymentsHistory.map(v=>`
                                                <tr>
                                                    <td>${new Date(v.date).toLocaleDateString("es-ES",{month:"short",day:"numeric",year:"numeric"})}</td>
                                                    <td>Cuota Capital</td>
                                                    <td class="font-bold">${g(parseFloat(v.capital)+parseFloat(v.interest))}</td>
                                                    <td><span class="badge-vivid badge-success-vivid">PAGADO</span></td>
                                                </tr>
                                            `).reverse().join("")}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Formulario de Registro Rápido -->
                        <div class="glass card-padding" style="margin-top: 2rem;">
                            <h3>Registrar Pago</h3>
                            <form id="payment-form" class="payment-entry-form">
                                <div class="form-grid-4">
                                    <lender-input 
                                        id="pay-capital" 
                                        label="Capital" 
                                        type="text" 
                                        placeholder="0" 
                                        validator='{"type":"number","min":0}'
                                        error-messages='{"type":"Ingresa un número válido","min":"El valor no puede ser negativo."}'>
                                    </lender-input>
                                    <lender-input 
                                        id="pay-interest" 
                                        label="Interés" 
                                        type="text" 
                                        placeholder="0" 
                                        validator='{"type":"number","min":0}'
                                        error-messages='{"type":"Ingresa un número válido","min":"El valor no puede ser negativo."}'>
                                    </lender-input>
                                    <lender-input 
                                        id="pay-date" 
                                        label="Fecha del Pago" 
                                        type="date" 
                                        value="${new Date().toISOString().split("T")[0]}"
                                        validator='{"required":true}'
                                        error-messages='{"required":"La fecha es requerida."}'>
                                    </lender-input>
                                    <lender-input 
                                        id="pay-next-deadline" 
                                        label="Nueva Fecha Límite" 
                                        type="date" 
                                        value="${t.deadlineDate||""}">
                                    </lender-input>
                                </div>
                                <button type="submit" class="btn btn-primary btn-block">Confirmar Transacción</button>
                            </form>
                        </div>
                    </div>

                    <!-- Sidebar inspirado -->
                    <aside class="profile-sidebar">
                        <section class="glass sidebar-section">
                            <div class="section-header">
                                <span class="material-icons">person</span>
                                <h3>Detalles Personales</h3>
                            </div>
                            <div class="detail-item">
                                <div class="item-icon">@</div>
                                <div class="item-text">
                                    <p class="label">Correo Electrónico</p>
                                    <p class="value">${u||"No registrado"}</p>
                                </div>
                            </div>
                            <div class="detail-item">
                                <div class="item-icon"><span class="material-icons">phone</span></div>
                                <div class="item-text">
                                    <p class="label">Número de Teléfono</p>
                                    <p class="value">${p||"No registrado"}</p>
                                </div>
                            </div>
                            <div class="detail-item">
                                <div class="item-icon"><span class="material-icons">account_balance_wallet</span></div>
                                <div class="item-text">
                                    <p class="label">Puntaje de Pago</p>
                                    <p class="value accent-green">EXCELENTE</p>
                                </div>
                            </div>
                        </section>

                        <section class="sidebar-section">
                            <h3>ACCIONES DE COMANDO</h3>
                            <div class="command-grid">
                                <div class="command-btn glass" id="edit-profile-btn">
                                    <span class="material-icons">edit</span>
                                    <span>Editar Perfil</span>
                                </div>
                                <div class="command-btn glass" id="status-toggle-btn">
                                    <span class="material-icons">pause_circle</span>
                                    <span>${t.status==="mora"?"Activar":"Poner en Mora"}</span>
                                </div>
                                <div class="command-btn glass" id="finish-loan-btn">
                                    <span class="material-icons">check_circle</span>
                                    <span>Finalizar Crédito</span>
                                </div>
                                <div class="command-btn glass" id="export-history-btn">
                                    <span class="material-icons">file_download</span>
                                    <span>Exportar Historial</span>
                                </div>
                            </div>
                            <button class="btn-danger-vivid">RESTRICCIONES Y ALERTAS</button>
                        </section>
                    </aside>
                </div>
            </div>
        `,this.setupEventListeners()}setupEventListeners(){const e=this.querySelector("#back-to-borrowers");e&&e.addEventListener("click",()=>{window.dispatchEvent(new CustomEvent("view-change",{detail:"borrowers"}))});const t=this.querySelector("#status-toggle-btn");t&&t.addEventListener("click",()=>{const{loans:i}=h.getState(),o=i.find(l=>l.id===this.borrowerId).status==="mora"?"active":"mora";h.dispatch({type:"UPDATE_LOAN_STATUS",payload:{id:this.borrowerId,status:o}})});const r=this.querySelector("#finish-loan-btn");r&&r.addEventListener("click",()=>{confirm("¿Seguro que deseas marcar este crédito como COMPLETADO?")&&h.dispatch({type:"UPDATE_LOAN_STATUS",payload:{id:this.borrowerId,status:"completed"}})});const a=this.querySelector("#payment-form");a&&a.addEventListener("submit",i=>{i.preventDefault(),this.clearErrors();const{loans:d}=h.getState(),o=d.find(C=>C.id===this.borrowerId);if(!o)return;const l=this.querySelector("#pay-capital"),u=this.querySelector("#pay-interest"),p=this.querySelector("#pay-date"),m=this.querySelector("#pay-next-deadline"),v=l.validate(),b=u.validate(),y=p.validate();if(!v||!b||!y)return;const E=parseFloat(l.value.replace(/,/g,""))||0,T=parseFloat(u.value.replace(/,/g,""))||0,D=p.value,S=m.value;E===0&&T===0&&S===o.deadlineDate||(E>0||T>0?h.dispatch({type:"RECORD_PAYMENT",payload:{loanId:this.borrowerId,payment:{capital:E,interest:T,date:D},nextDeadline:S}}):S!==o.deadlineDate&&h.dispatch({type:"UPDATE_LOAN",payload:{id:this.borrowerId,deadlineDate:S}}),L.show(`Los cambios en ${safeBorrowerName} han sido registrados satisfactoriamente`),a.reset(),this.querySelector("#pay-date").value=new Date().toISOString().split("T")[0])});const s=this.querySelector("#edit-profile-btn");s&&s.addEventListener("click",()=>{window.dispatchEvent(new CustomEvent("view-change",{detail:{view:"edit-borrower",data:this.borrowerId}}))});const n=this.querySelector("#export-history-btn");n&&n.addEventListener("click",()=>{const{loans:i}=h.getState(),d=i.find(o=>o.id===this.borrowerId);d&&_.generateBorrowerComprehensiveReport(d.borrowerName,i)})}getStatusClass(e){return e.status==="mora"?"badge-mora":e.status==="completed"?"badge-pagado":"badge-ontrack"}getStatusLabel(e){return e.status==="mora"?"EN MORA":e.status==="completed"?"PAGADO":"ON TRACK"}showError(e){const t=this.querySelector(`#group-${e}`);t&&t.classList.add("error")}clearErrors(){this.querySelectorAll(".form-group").forEach(e=>e.classList.remove("error"))}}customElements.define("borrower-detail-view",de);const ce="modulepreload",ue=function(c){return"/"+c},H={},B=function(e,t,r){let a=Promise.resolve();if(t&&t.length>0){let n=function(o){return Promise.all(o.map(l=>Promise.resolve(l).then(u=>({status:"fulfilled",value:u}),u=>({status:"rejected",reason:u}))))};document.getElementsByTagName("link");const i=document.querySelector("meta[property=csp-nonce]"),d=(i==null?void 0:i.nonce)||(i==null?void 0:i.getAttribute("nonce"));a=n(t.map(o=>{if(o=ue(o),o in H)return;H[o]=!0;const l=o.endsWith(".css"),u=l?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${o}"]${u}`))return;const p=document.createElement("link");if(p.rel=l?"stylesheet":ce,l||(p.as="script"),p.crossOrigin="",p.href=o,d&&p.setAttribute("nonce",d),document.head.appendChild(p),l)return new Promise((m,v)=>{p.addEventListener("load",m),p.addEventListener("error",()=>v(new Error(`Unable to preload CSS for ${o}`)))})}))}function s(n){const i=new Event("vite:preloadError",{cancelable:!0});if(i.payload=n,window.dispatchEvent(i),!i.defaultPrevented)throw n}return a.then(n=>{for(const i of n||[])i.status==="rejected"&&s(i.reason);return e().catch(s)})};class pe extends HTMLElement{constructor(){super(),this.loanId=null}static get observedAttributes(){return["borrower-id"]}attributeChangedCallback(e,t,r){e==="borrower-id"&&(this.loanId=r,this.render())}connectedCallback(){this.render()}render(){if(!this.loanId)return;const{loans:e}=h.getState(),t=e.find(n=>n.id===this.loanId);if(!t){this.innerHTML='<div class="dashboard-wrapper"><h1>Prestatario no encontrado</h1></div>';return}const r=DOMPurify.sanitize(t.borrowerName||"",{ALLOWED_TAGS:[],ALLOWED_ATTR:[]}),a=DOMPurify.sanitize(t.email||"",{ALLOWED_TAGS:[],ALLOWED_ATTR:[]}),s=DOMPurify.sanitize(t.phone||"",{ALLOWED_TAGS:[],ALLOWED_ATTR:[]});this.innerHTML=`
            <div class="dashboard-wrapper">
                <header class="view-header">
                    <div class="view-header-content">
                        <div class="edit-borrower-header-row">
                            <button class="btn-icon" id="back-to-detail">
                                <span class="material-icons">arrow_back</span>
                            </button>
                            <h1>Editar Perfil de Prestatario</h1>
                        </div>
                        <p>Modifica la información personal de ${r}.</p>
                    </div>
                </header>

                <div class="form-container glass">
                    <form id="edit-borrower-form">
                        <div class="form-section">
                            <h3>Información Personal</h3>
                            <lender-input 
                                id="edit-name" 
                                label="Nombre del Prestatario" 
                                value="${r}" 
                                validator='{"required":true,"minlength":3}'
                                error-messages='{"required":"El nombre es requerido","minlength":"El nombre debe tener al menos 3 caracteres."}'>
                            </lender-input>
                            <div class="form-grid">
                                <lender-input 
                                    id="edit-email" 
                                    type="email" 
                                    label="Correo Electrónico" 
                                    value="${a}" 
                                    placeholder="correo@ejemplo.com"
                                    validator='{"type":"email"}'
                                    error-messages='{"type":"Ingresa un correo válido."}'>
                                </lender-input>
                                <lender-input 
                                    id="edit-phone" 
                                    type="tel" 
                                    label="Número de Teléfono" 
                                    value="${s}" 
                                    placeholder="+57..."
                                    validator='{"type":"tel"}'
                                    error-messages='{"type":"Ingresa un teléfono válido."}'>
                                </lender-input>
                            </div>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" id="cancel-edit">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Guardar Cambios</button>
                        </div>
                    </form>
                </div>
            </div>
        `,this.setupEventListeners()}setupEventListeners(){const e=this.querySelector("#back-to-detail"),t=this.querySelector("#cancel-edit"),r=this.querySelector("#edit-borrower-form"),a=()=>{window.dispatchEvent(new CustomEvent("view-change",{detail:{view:"borrower-detail",data:this.loanId}}))};e.addEventListener("click",a),t.addEventListener("click",a),r.addEventListener("submit",s=>{s.preventDefault();const n=this.querySelector("#edit-name"),i=this.querySelector("#edit-email"),d=this.querySelector("#edit-phone"),o=n.validate(),l=i.validate(),u=d.validate();if(!o||!l||!u){B(async()=>{const{NotificationPanel:m}=await Promise.resolve().then(()=>x);return{NotificationPanel:m}},void 0).then(({NotificationPanel:m})=>{m.show("Por favor corrige los campos marcados en rojo.")});return}const p={id:this.loanId,borrowerName:n.value,email:i.value,phone:d.value};h.dispatch({type:"UPDATE_LOAN",payload:p}),B(async()=>{const{NotificationPanel:m}=await Promise.resolve().then(()=>x);return{NotificationPanel:m}},void 0).then(({NotificationPanel:m})=>{m.show("Perfil actualizado con éxito")}),a()})}}customElements.define("edit-borrower-view",pe);class he extends HTMLElement{constructor(){super(),this.currentFilter="all"}connectedCallback(){this.render(),h.subscribe(()=>this.render())}render(){const{loans:e}=h.getState(),t=e.reduce((s,n)=>s+(n.paymentsHistory||[]).reduce((i,d)=>i+(parseFloat(d.interest)||0),0),0),r=e.filter(s=>s.status!=="completed").reduce((s,n)=>{const i=(n.paymentsHistory||[]).reduce((d,o)=>d+(parseFloat(o.capital)||0),0);return s+(n.amount-i)},0),a=e.filter(s=>this.currentFilter==="all"?!0:s.status===this.currentFilter);this.innerHTML=`
            <div class="dashboard-wrapper">
                <header class="view-header">
                    <div class="view-header-content">
                        <h1>Gestión de Cartera</h1>
                        <p>Seguimiento global de préstamos y rendimientos históricos.</p>
                    </div>
                    <div class="dashboard-actions">
                        <button class="btn btn-secondary" id="export-portfolio-btn">
                            <span class="material-icons">file_download</span> Generar Reporte
                        </button>
                    </div>
                </header>

                <!-- Widgets de Rendimiento -->
                <div class="stats-grid-vivid" style="grid-template-columns: repeat(3, 1fr);">
                    <div class="stat-card glass accent-line" style="--accent-color: #10B981">
                        <div class="stat-header"><h3>Intereses Ganados</h3></div>
                        <p class="stat-value vivid-text" style="color: #10B981">${g(t)}</p>
                        <span class="stat-subtext">Total histórico cobrado</span>
                    </div>
                    <div class="stat-card glass accent-line" style="--accent-color: #06B6D4">
                        <div class="stat-header"><h3>Capital en Juego</h3></div>
                        <p class="stat-value vivid-text" style="color: #06B6D4">${g(r)}</p>
                        <span class="stat-subtext">Activo corriente</span>
                    </div>
                    <div class="stat-card glass accent-line" style="--accent-color: #F59E0B">
                        <div class="stat-header"><h3>Total Préstamos</h3></div>
                        <p class="stat-value vivid-text" style="color: #F59E0B">${e.length}</p>
                        <span class="stat-subtext">Registros en el sistema</span>
                    </div>
                </div>

                <!-- Filtros de Estado -->
                <div class="filter-tabs glass" style="display:flex; gap:1rem; padding:0.5rem; border-radius:12px; margin-bottom:1.5rem;">
                    <button class="filter-btn ${this.currentFilter==="all"?"active":""}" data-filter="all">Todos</button>
                    <button class="filter-btn ${this.currentFilter==="active"?"active":""}" data-filter="active">Activos</button>
                    <button class="filter-btn ${this.currentFilter==="mora"?"active":""}" data-filter="mora">En Mora</button>
                    <button class="filter-btn ${this.currentFilter==="completed"?"active":""}" data-filter="completed">Finalizados</button>
                </div>

                <div class="table-container glass">
                    <table class="lender-table">
                        <thead>
                            <tr>
                                <th>Ref / Prestatario</th>
                                <th>Capital</th>
                                <th>Int. Pagados</th>
                                <th>Esquema</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${a.length===0?'<tr><td colspan="6" style="text-align:center; padding: 3rem; color: var(--text-muted)">No se encontraron préstamos en esta categoría.</td></tr>':a.map(s=>{const n=(s.paymentsHistory||[]).reduce((p,m)=>p+(parseFloat(m.interest)||0),0),i=this.getStatusClass(s),d=this.getStatusLabel(s),o=DOMPurify.sanitize(s.borrowerName||"",{ALLOWED_TAGS:[],ALLOWED_ATTR:[]}),l=DOMPurify.sanitize(s.referenceId||"",{ALLOWED_TAGS:[],ALLOWED_ATTR:[]}),u=DOMPurify.sanitize(s.id||"",{ALLOWED_TAGS:[],ALLOWED_ATTR:[]});return`
                                        <tr>
                                            <td data-label="Ref / Prestatario">
                                                <div style="display:flex; flex-direction:column">
                                                    <span style="color:var(--primary); font-size:0.75rem; font-weight:700">#${l||"N/A"}</span>
                                                    <span style="font-weight:600">${o}</span>
                                                </div>
                                            </td>
                                            <td data-label="Capital">${g(s.amount)}</td>
                                            <td data-label="Int. Pagados" class="accent-green">${g(n)}</td>
                                            <td data-label="Esquema" style="font-size:0.8rem">${s.scheme==="fixed"?"CUOTA FIJA":"CUOTA DECRECIENTE"}</td>
                                            <td data-label="Estado"><span class="badge ${i}">${d}</span></td>
                                            <td data-label="Acciones">
                                                <button class="btn-icon view-details-btn" data-id="${u}">
                                                    <span class="material-icons">visibility</span>
                                                </button>
                                            </td>
                                        </tr>
                                    `}).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        `,this.setupEventListeners()}setupEventListeners(){this.querySelectorAll(".filter-btn").forEach(t=>{t.addEventListener("click",()=>{this.currentFilter=t.getAttribute("data-filter"),this.render()})}),this.querySelectorAll(".view-details-btn").forEach(t=>{t.addEventListener("click",()=>{const r=t.getAttribute("data-id");window.dispatchEvent(new CustomEvent("view-change",{detail:{view:"borrower-detail",data:r}}))})});const e=this.querySelector("#export-portfolio-btn");e&&e.addEventListener("click",()=>{const{loans:t}=h.getState();_.generatePortfolioReport(t)})}getStatusClass(e){return e.status==="mora"?"badge-danger":e.status==="completed"?"badge-success":"badge-warning"}getStatusLabel(e){return e.status==="mora"?"EN MORA":e.status==="completed"?"PAGADO":"ACTIVO"}}customElements.define("loans-list-view",he);class w extends HTMLElement{constructor(){super(),this._isTouched=!1}static sanitize(e){return DOMPurify.sanitize(e,{ALLOWED_TAGS:[],ALLOWED_ATTR:[]})}static get observedAttributes(){return["label","type","placeholder","value","error-msg","required","min","minlength","id","validator","error-messages"]}attributeChangedCallback(e,t,r){if(t!==r&&this.querySelector("input")){if(e==="value"){const a=this.querySelector("input");a&&(a.value=w.sanitize(r))}else if(e==="error-msg"){const a=this.querySelector(".error-message");a&&(a.textContent=w.sanitize(r))}}}connectedCallback(){this.render();const e=this.querySelector("input");if(!e)return;e.addEventListener("blur",()=>{this._isTouched=!0,this.validate()}),e.addEventListener("input",()=>{this._isTouched&&this.validate()});const t=this.querySelector(".password-toggle");t&&t.addEventListener("click",()=>{const r=e.type==="password";e.type=r?"text":"password",t.classList.toggle("show",r)})}get value(){const e=this.querySelector("input"),t=e?e.value:"";return w.sanitize(t)}set value(e){const t=this.querySelector("input");t&&(t.value=w.sanitize(String(e)))}get touched(){return this._isTouched}resetTouched(){this._isTouched=!1,this.clearError()}validate(){const e=this.querySelector("input");if(this.querySelector(".lender-form-group"),!e)return!0;const t=this.runCustomValidation();if(t)return this.showError(t),!1;if(!e.checkValidity()){const r=e.validationMessage||this.getAttribute("error-msg")||"Campo inválido";return this.showError(r),!1}return this.clearError(),!0}runCustomValidation(){const e=this.value,t=this.getAttribute("validator"),r=this.getAttribute("error-messages");let a={},s={};try{t&&(a=JSON.parse(t)),r&&(s=JSON.parse(r))}catch{return console.warn("Invalid JSON in validator or error-messages attribute"),null}if(a.required&&!e.trim())return s.required||"Este campo es requerido";if(a.type==="number"&&e){const n=e.replace(/,/g,"").trim();if(isNaN(parseFloat(n)))return s.type||"Ingresa un número válido";const i=parseFloat(n);if(a.min!==void 0&&i<a.min)return s.min||`El valor debe ser al menos ${a.min}`;if(a.max!==void 0&&i>a.max)return s.max||`El valor no puede exceder ${this.formatNumber(a.max)}`;if(a.integer===!0&&!Number.isInteger(i))return s.integer||"El valor debe ser un número entero"}if(a.type==="email"&&e&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))return s.type||"Ingresa un correo válido";if(a.type==="tel"&&e&&!/^[\d\s\-\+\(\)]{7,}$/.test(e))return s.type||"Ingresa un teléfono válido";if(a.type==="password"&&e){const n=a.minlength&&e.length>=a.minlength,i=/[A-Z]/.test(e),d=/[a-z]/.test(e),o=/\d/.test(e),l=/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(e);if(!n)return s.minlength||`La contraseña debe tener al menos ${a.minlength} caracteres.`;if(!i)return s.uppercase||"La contraseña debe contener al menos una mayúscula.";if(!d)return s.lowercase||"La contraseña debe contener al menos una minúscula.";if(!o)return s.number||"La contraseña debe contener al menos un número.";if(!l)return s.special||"La contraseña debe contener al menos un carácter especial (@#$%^&*!)."}if(a.match&&e){const n=document.getElementById(a.match);if(n&&e!==n.value)return s.match||"Las contraseñas no coinciden."}return a.minlength&&e.length<a.minlength?s.minlength||`Debe tener al menos ${a.minlength} caracteres`:a.maxlength&&e.length>a.maxlength?s.maxlength||`Debe tener como máximo ${a.maxlength} caracteres`:a.pattern&&e&&!new RegExp(a.pattern).test(e)?s.pattern||"El formato no es válido":null}formatNumber(e){return new Intl.NumberFormat("es-CO").format(e)}showError(e){const t=this.querySelector(".lender-form-group"),r=this.querySelector(".error-message");t&&t.classList.add("error"),r&&(r.textContent=e)}clearError(){const e=this.querySelector(".lender-form-group");e&&e.classList.remove("error")}setError(e){this.showError(e)}render(){const e=this.getAttribute("id")||`input-${Math.random().toString(36).substr(2,9)}`,t=w.sanitize(this.getAttribute("label")||""),r=this.getAttribute("type")||"text",a=w.sanitize(this.getAttribute("placeholder")||""),s=w.sanitize(this.getAttribute("value")||""),n=w.sanitize(this.getAttribute("error-msg")||""),i=this.hasAttribute("required"),d=this.getAttribute("min")||"",o=this.getAttribute("minlength")||"",l=r==="password"?`
            <button type="button" class="password-toggle" aria-label="Mostrar contraseña">
                <span class="material-icons icon-show">visibility</span>
                <span class="material-icons icon-hide">visibility_off</span>
            </button>
        `:"",u=l?'<div class="input-wrapper">':"",p=l?"</div>":"";this.innerHTML=`
            <div class="lender-form-group">
                <label for="${e}-internal" class="lender-label">${t}</label>
                ${u}
                <input 
                    id="${e}-internal"
                    class="lender-input-field${l?" has-toggle":""}"
                    type="${r}" 
                    placeholder="${a}" 
                    value="${s}"
                    ${i?"required":""}
                    ${d?`min="${d}"`:""}
                    ${o?`minlength="${o}"`:""}
                >
                ${l}
                ${p}
                <span class="error-message">${n}</span>
            </div>
        `}}customElements.define("lender-input",w);class me extends HTMLElement{constructor(){super(),this.innerHTML=`
      <div id="login-loader" class="loader-overlay">
        <div class="loader-content">
          <div class="loader-spinner"></div>
          <div class="loader-text">Procesando...</div>
        </div>
      </div>
      <div class="dashboard-wrapper user-auth">
        <div class="dashboard-content">
          <header class="view-header">
            <div class="view-header-content">
              <h1>Iniciar sesión</h1>
              <p>Accede para gestionar tu cartera de préstamos.</p>
            </div>
          </header>

          <div class="form-container glass">
            <form id="login-form">
              <div class="form-section">
                <lender-input
                  id="login-email"
                  type="email"
                  label="Correo electrónico"
                  placeholder="tu@correo.com"
                  validator='{"required":true,"type":"email"}'
                  error-messages='{"required":"El correo es requerido","type":"Ingresa un correo válido."}'>
                </lender-input>
                <lender-input
                  id="login-password"
                  type="password"
                  label="Contraseña"
                  placeholder="••••••••"
                  validator='{"required":true}'
                  error-messages='{"required":"La contraseña es requerida."}'>
                </lender-input>
              </div>

              <div class="form-actions" style="justify-content: space-between;">
                <button type="button" class="btn btn-secondary" id="go-register">Crear cuenta</button>
                <button type="submit" class="btn btn-primary">Entrar</button>
              </div>
            </form>
          </div>
        </div>

      </div>
    `}showLoader(){var e;(e=this.querySelector("#login-loader"))==null||e.classList.add("active")}hideLoader(){var e;(e=this.querySelector("#login-loader"))==null||e.classList.remove("active")}connectedCallback(){var t,r;requestAnimationFrame(()=>{requestAnimationFrame(()=>{const a=this.querySelector(".user-auth");a&&a.classList.add("fade-in")})});const e=A();if(e!=null&&e.token){h.setSession(e),h.loadLoansFromApi().catch(()=>{}),window.dispatchEvent(new CustomEvent("view-change",{detail:"dashboard"}));return}(t=this.querySelector("#go-register"))==null||t.addEventListener("click",()=>{window.dispatchEvent(new CustomEvent("view-change",{detail:"register"}))}),(r=this.querySelector("#login-form"))==null||r.addEventListener("submit",async a=>{var d;a.preventDefault();const s=this.querySelector("#login-email"),n=this.querySelector("#login-password");if(s.validate()&n.validate())try{this.showLoader();const o=await te({email:s.value,password:n.value});h.setSession(A()),await h.migrateLocalLoansToApiIfNeeded().catch(()=>{}),await h.loadLoansFromApi(),this.hideLoader();const l=DOMPurify.sanitize(((d=o.user)==null?void 0:d.fullName)||"usuario",{ALLOWED_TAGS:[],ALLOWED_ATTR:[]});L.show(`Bienvenido, ${l}`,()=>{window.dispatchEvent(new CustomEvent("view-change",{detail:"dashboard"}))})}catch(o){this.hideLoader(),L.show(o.message||"Error al iniciar sesión")}})}}customElements.define("login-view",me);class ve extends HTMLElement{constructor(){super(),this.innerHTML=`
      <div id="register-loader" class="loader-overlay">
        <div class="loader-content">
          <div class="loader-spinner"></div>
          <div class="loader-text">Creando cuenta...</div>
        </div>
      </div>
      <div class="dashboard-wrapper user-auth">
        <div class="dashboard-content">
          <header class="view-header">
            <div class="view-header-content">
              <h1>Crear cuenta</h1>
              <p>Registra un usuario para empezar a gestionar tus préstamos.</p>
            </div>
          </header>

          <div class="form-container glass">
            <form id="register-form">
              <div class="form-section">
                <lender-input
                  id="reg-fullname"
                  label="Nombre completo"
                  placeholder="Ej. Alex Sterling"
                  validator='{"required":true,"minlength":3}'
                  error-messages='{"required":"El nombre es requerido","minlength":"El nombre debe tener al menos 3 caracteres."}'>
                </lender-input>
                <lender-input
                  id="reg-email"
                  type="email"
                  label="Correo electrónico"
                  placeholder="tu@correo.com"
                  validator='{"required":true,"type":"email"}'
                  error-messages='{"required":"El correo es requerido","type":"Ingresa un correo válido."}'>
                </lender-input>
                <div class="form-grid">
                  <lender-input
                    id="reg-password"
                    type="password"
                    label="Contraseña"
                    placeholder="Ej. Password123@"
                    validator='{"required":true,"type":"password","minlength":8}'
                    error-messages='{"required":"La contraseña es requerida.","minlength":"La contraseña debe tener al menos 8 caracteres.","uppercase":"Debe contener al menos una mayúscula.","lowercase":"Debe contener al menos una minúscula.","number":"Debe contener al menos un número.","special":"Debe contener al menos un carácter especial (@#$%^&*!)."}'>
                  </lender-input>
                  <lender-input
                    id="reg-confirm"
                    type="password"
                    label="Confirmar contraseña"
                    placeholder="Repite la contraseña"
                    validator='{"required":true,"match":"reg-password"}'
                    error-messages='{"required":"Confirma tu contraseña.","match":"Las contraseñas no coinciden."}'>
                  </lender-input>
                </div>
              </div>

              <div class="form-actions" style="justify-content: space-between;">
                <button type="button" class="btn btn-secondary" id="go-login">Ya tengo cuenta</button>
                <button type="submit" class="btn btn-primary">Registrar</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `}showLoader(){var e;(e=this.querySelector("#register-loader"))==null||e.classList.add("active")}hideLoader(){var e;(e=this.querySelector("#register-loader"))==null||e.classList.remove("active")}connectedCallback(){var e,t;(e=this.querySelector("#go-login"))==null||e.addEventListener("click",()=>{window.dispatchEvent(new CustomEvent("view-change",{detail:"login"}))}),(t=this.querySelector("#register-form"))==null||t.addEventListener("submit",async r=>{var o;r.preventDefault();const a=this.querySelector("#reg-fullname"),s=this.querySelector("#reg-email"),n=this.querySelector("#reg-password"),i=this.querySelector("#reg-confirm");if(a.validate()&s.validate()&n.validate()&i.validate())try{this.showLoader();const l=await ee({email:s.value,password:n.value,fullName:a.value});h.setSession(A()),await h.migrateLocalLoansToApiIfNeeded().catch(()=>{}),await h.loadLoansFromApi(),this.hideLoader();const u=DOMPurify.sanitize(((o=l.user)==null?void 0:o.fullName)||"usuario",{ALLOWED_TAGS:[],ALLOWED_ATTR:[]});L.show(`Cuenta creada. Bienvenido, ${u}`,()=>{window.dispatchEvent(new CustomEvent("view-change",{detail:"dashboard"}))})}catch(l){this.hideLoader(),L.show(l.message||"Error al registrar")}})}}customElements.define("register-view",ve);class ge extends HTMLElement{constructor(){super()}connectedCallback(){this.render(),requestAnimationFrame(()=>{requestAnimationFrame(()=>{this.querySelector(".modal-backdrop").classList.add("fade-in"),this.querySelector(".modal-content").classList.add("fade-in")})})}render(){this.innerHTML=`
            <div class="modal-backdrop">
                <div class="modal-content glass">
                    <div class="modal-header">
                        <h2 class="view-header" style="margin-bottom: 0;">¿Deseas cerrar sesión?</h2>
                        <button class="close-btn">&times;</button>
                    </div>
                    <div class="form-actions" style="margin-top: 1.5rem;">
                        <button id="cancel-logout" class="btn btn-secondary">Rechazar</button>
                        <button id="confirm-logout" class="btn btn-primary">Confirmar</button>
                    </div>
                </div>
            </div>
        `,this.querySelector(".close-btn").addEventListener("click",()=>this.close()),this.querySelector("#cancel-logout").addEventListener("click",()=>this.close()),this.querySelector("#confirm-logout").addEventListener("click",()=>this.handleConfirm()),this.querySelector(".modal-backdrop").addEventListener("click",e=>{e.target.classList.contains("modal-backdrop")&&this.close()})}close(){h.setLogoutModal(!1),this.remove()}async handleConfirm(){try{L.show("haz cerrado sesión satisfactoriamente"),setTimeout(async()=>{await ae(),h.clearSession(),h.setLogoutModal(!1),window.dispatchEvent(new CustomEvent("view-change",{detail:"login"})),this.remove()},3e3)}catch(e){console.error("Error during logout:",e),this.close()}}}customElements.define("logout-modal",ge);const be=()=>{if(!("Notification"in window)){console.warn("Este navegador no soporta notificaciones de escritorio");return}Notification.permission!=="denied"&&Notification.requestPermission(),setInterval(()=>z(),6e4),setInterval(()=>W(),36e5),z(),W()},z=()=>{const{loans:c}=h.getState(),e=new Date().toISOString().split("T")[0];let t=0;c.forEach(r=>{(r.schedule||[]).forEach(a=>{a.date===e&&a.status==="pendiente"&&t++})}),t>0&&new Notification("Lender's HQ | Recordatorio de Cobro",{body:`Tienes ${t} cobros pendientes para el día de hoy.`,icon:"/assets/icon.png"})},W=()=>{const{loans:c}=h.getState(),e=new Date;e.setHours(0,0,0,0);const t=new Date(e);t.setDate(t.getDate()+7);const r=[];if(c.forEach(a=>{(a.schedule||[]).forEach(s=>{if(s.status==="pendiente"){const n=new Date(s.date);if(n.setHours(0,0,0,0),n>e&&n<=t){const i=Math.ceil((n-e)/864e5);r.push({borrower:a.borrowerName,amount:s.totalPayment,date:s.date,daysUntil:i})}}})}),r.length>0){const a=r.sort((i,d)=>new Date(i.date)-new Date(d.date)),s=a.slice(0,3).map(i=>`${i.borrower}: ${i.daysUntil===1?"mañana":`en ${i.daysUntil} días`}`).join(", "),n=r.length===1?`${a[0].borrower} debe pagar mañana.`:`Próximos cobros: ${s}${r.length>3?` y ${r.length-3} más`:""}.`;new Notification("Lender's HQ | Recordatorio Semanal",{body:n})}};class fe{static init(){this.messageQueue=[],this.isNotifying=!1;const e=()=>{document.removeEventListener("click",e),this.checkAlarms()};document.addEventListener("click",e)}static checkAlarms(){const{loans:e}=h.getState(),t=e.filter(i=>i.status!=="completed"),r=new Date,a=r.getDate(),s=r.getMonth(),n=r.getFullYear();t.forEach(i=>{const d=i.paymentsHistory||[];(i.schedule||[]).some(p=>p.status==="mora")&&this.queueNotification(`🚨 ¡MORA! El prestatario ${i.borrowerName} tiene pagos vencidos.`);const u=new Date(i.startDate);if(a===u.getDate()&&(d.some(m=>{const v=new Date(m.date);return v.getMonth()===s&&v.getFullYear()===n&&parseFloat(m.interest)>0})||this.queueNotification(`📅 INTERÉS MENSUAL: Hoy corresponde el cobro de intereses a ${i.borrowerName}.`)),i.deadlineDate){const p=new Date(i.deadlineDate),m=new Date(n,s,a),b=new Date(p.getFullYear(),p.getMonth(),p.getDate())-m,y=Math.ceil(b/(1e3*60*60*24));y===0?this.queueNotification(`⚠️ FECHA LÍMITE: Hoy vence el plazo final para ${i.borrowerName}. Se debe cobrar capital + intereses.`):y>0&&y<=3&&this.queueNotification(`⏳ RECORDATORIO: Faltan ${y} días para la fecha límite de ${i.borrowerName}.`)}})}static queueNotification(e){this.messageQueue.push(e),this.processQueue()}static processQueue(){if(this.isNotifying||this.messageQueue.length===0)return;this.isNotifying=!0;const e=this.messageQueue.shift();this.playSound(),L.show(e,()=>{this.isNotifying=!1,setTimeout(()=>this.processQueue(),500)})}static playSound(){try{const e=new Audio("./assets/sounds/doorbell-tone.wav");e.volume=.6,e.play()}catch(e){console.warn("El audio no pudo reproducirse:",e)}}}localStorage.getItem("lender_theme")==="light"&&document.body.classList.add("light-theme");function ye(c){const e="Lender's HQ",t={login:"Acceso",register:"Crear Cuenta",dashboard:"Panel Principal","new-loan":"Nuevo Préstamo",borrowers:"Prestatarios","borrower-detail":"Detalle de Préstamo","edit-borrower":"Editar Registro",loans:"Libro de Préstamos",collector:"Modo Cobrador"};document.title=t[c]?`${t[c]} | ${e}`:`${e} | Gestión de Préstamos`}window.addEventListener("view-change",c=>{const e=document.querySelector("#main-content"),t=typeof c.detail=="string"?c.detail:c.detail.view,r=typeof c.detail=="object"?c.detail.data:null;ye(t);const a=document.querySelector("lender-nav"),s=document.querySelector("#mobile-menu-btn");if(!e)return;const n=h.isAuthenticated();if(e.classList.remove("fade-in"),setTimeout(()=>{switch(e.innerHTML="",t){case"login":e.innerHTML="<login-view></login-view>";break;case"register":e.innerHTML="<register-view></register-view>";break;case"dashboard":if(!n){e.innerHTML="<login-view></login-view>";break}e.innerHTML="<lender-dashboard></lender-dashboard>";break;case"new-loan":if(!n){e.innerHTML="<login-view></login-view>";break}e.innerHTML="<new-loan-view></new-loan-view>";break;case"borrowers":if(!n){e.innerHTML="<login-view></login-view>";break}e.innerHTML="<borrowers-view></borrowers-view>";break;case"borrower-detail":if(!n){e.innerHTML="<login-view></login-view>";break}{const i=DOMPurify.sanitize(String(r||""),{ALLOWED_TAGS:[],ALLOWED_ATTR:[]});e.innerHTML=`<borrower-detail-view borrower-id="${i}"></borrower-detail-view>`}break;case"edit-borrower":if(!n){e.innerHTML="<login-view></login-view>";break}{const i=DOMPurify.sanitize(String(r||""),{ALLOWED_TAGS:[],ALLOWED_ATTR:[]});e.innerHTML=`<edit-borrower-view borrower-id="${i}"></edit-borrower-view>`}break;case"loans":if(!n){e.innerHTML="<login-view></login-view>";break}e.innerHTML="<loans-list-view></loans-list-view>";break;case"collector":if(!n){e.innerHTML="<login-view></login-view>";break}e.innerHTML='<h1 style="padding:4rem 2rem">Modo Cobrador (Próximamente)</h1>';break}requestAnimationFrame(()=>{e.classList.add("fade-in")})},150),a&&window.innerWidth<768){const i=a.querySelector(".sidebar");if(i){i.classList.remove("active");const d=s==null?void 0:s.querySelector(".material-icons");d&&(d.textContent="menu")}}});window.addEventListener("open-modal",c=>{const e=c.detail;if(e==="add-loan"){const t=document.createElement("loan-form");document.body.appendChild(t)}else if(e==="logout"){const t=document.createElement("logout-modal");document.body.appendChild(t)}});const M=document.querySelector("#mobile-menu-btn");M&&M.addEventListener("click",()=>{const c=document.querySelector("lender-nav"),e=c==null?void 0:c.querySelector(".sidebar");if(e){e.classList.toggle("active");const t=M.querySelector(".material-icons");t&&(t.textContent=e.classList.contains("active")?"close":"menu")}});be();fe.init();const P=A();P!=null&&P.token?(h.setSession(P),h.loadLoansFromApi().then(()=>window.dispatchEvent(new CustomEvent("view-change",{detail:"dashboard"}))).catch(()=>window.dispatchEvent(new CustomEvent("view-change",{detail:"login"})))):window.dispatchEvent(new CustomEvent("view-change",{detail:"login"}));
