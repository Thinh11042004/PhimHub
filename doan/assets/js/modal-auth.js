// assets/js/modal-auth.js
// Popup Login/Register + User menu; dùng đúng credential & key như login.js để các trang khác nhận login.

const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];

const overlay     = $("#auth-overlay");
const loginModal  = $("#login-modal");
const regModal    = $("#register-modal");
const authActions = $("#auth-actions");
const avatarBtn   = $("#avatar-btn");
const userMenu    = $("#user-menu");

/* ========= DEMO CREDENTIALS (bê từ login.js) ========= */
const DEMO_USER = {
  id: "u_001",
  email: "nguoidung@gmail.com",
  username: "nguoidung",
  name: "Người dùng 1",
  avatar: "assets/img/avatar.jpg",
  password: "123456",
  role: "user"
};
const DEMO_ADMIN = {
  id: "u_999",
  email: "admin@gmail.com",
  username: "admin",
  name: "Quản trị viên",
  avatar: "assets/img/admin.png", // nếu file chưa có, UI vẫn dùng avatar mặc định
  password: "123456",
  role: "admin"
};

/* ========= Auth Storage (đặt key đúng như guard đang dùng) ========= */
const AUTH_KEYS = ["demo-login","user","token","isLoggedIn","loggedIn","auth_user","profile"];

function setAllAuth(found){
  const user = {
    id: found.id,
    email: found.email,
    username: found.username,
    name: found.name,
    avatar: found.avatar,
    role: found.role
  };
  const token = "mock-token-" + Date.now();

  // localStorage (chuẩn guard hiện tại)
  localStorage.setItem("demo-login","1");
  localStorage.setItem("user", JSON.stringify(user));

  // dự phòng cho vài trang khác
  localStorage.setItem("auth_user", JSON.stringify(user));
  localStorage.setItem("profile",   JSON.stringify(user));
  localStorage.setItem("token",     token);
  localStorage.setItem("isLoggedIn","true");
  localStorage.setItem("loggedIn",  "true");

  // sessionStorage (nếu có trang check sessionStorage)
  try{
    sessionStorage.setItem("demo-login","1");
    sessionStorage.setItem("user", JSON.stringify(user));
    sessionStorage.setItem("auth_user", JSON.stringify(user));
    sessionStorage.setItem("profile",   JSON.stringify(user));
    sessionStorage.setItem("token",     token);
    sessionStorage.setItem("isLoggedIn","true");
    sessionStorage.setItem("loggedIn",  "true");
  }catch(_){}
}

function clearAllAuth(){
  for (const k of AUTH_KEYS){
    localStorage.removeItem(k);
    try{ sessionStorage.removeItem(k); }catch(_){}
  }
}

/* ========= UI Header ========= */
function isLogged(){
  return localStorage.getItem("demo-login")==="1" || sessionStorage.getItem("demo-login")==="1";
}
function initAuthUI(){
  if(isLogged()){
    authActions && (authActions.style.display="none");
    avatarBtn   && (avatarBtn.style.display="");
  }else{
    avatarBtn   && (avatarBtn.style.display="none");
    authActions && (authActions.style.display="");
    closeUserMenu();
  }
}

/* ========= Overlay helpers ========= */
function lockScroll(){ document.body.classList.add("modal-open"); }
function unlockScroll(){ document.body.classList.remove("modal-open"); }

function openOverlay(which){ // 'login' | 'register'
  if(!overlay) return;
  overlay.classList.add("open");
  overlay.style.display = "flex";
  lockScroll();

  if(which === "login"){
    regModal && (regModal.style.display="none");
    loginModal && (loginModal.style.display="flex");
    loginModal?.querySelector("#login-username")?.focus();
  }else{
    loginModal && (loginModal.style.display="none");
    regModal && (regModal.style.display="flex");
    regModal?.querySelector("#reg-name")?.focus();
  }
}
function closeOverlay(){
  if(!overlay) return;
  overlay.classList.remove("open");
  overlay.style.display = "none";
  unlockScroll();
  loginModal && (loginModal.style.display="none");
  regModal && (regModal.style.display="none");
}

/* ========= Hook các link cũ để mở modal (giữ nguyên cấu trúc của bạn) ========= */
$$('a[href="login.html"], [data-open="login"]').forEach(el=>{
  el.addEventListener("click", e=>{ e.preventDefault(); openOverlay("login"); });
});
$$('a[href="register.html"], [data-open="register"]').forEach(el=>{
  el.addEventListener("click", e=>{ e.preventDefault(); openOverlay("register"); });
});
$("#to-register")?.addEventListener("click", e=>{ e.preventDefault(); openOverlay("register"); });
$("#to-login")?.addEventListener("click", e=>{ e.preventDefault(); openOverlay("login"); });

/* ========= Đóng modal ========= */
overlay?.querySelectorAll(".auth-close").forEach(btn=>{
  btn.addEventListener("click", e=>{ e.preventDefault(); closeOverlay(); });
});
overlay?.addEventListener("click", (e)=>{
  if(!e.target.closest(".auth-card")) closeOverlay();
});
window.addEventListener("keydown", (e)=>{
  if(e.key === "Escape" && overlay?.classList.contains("open")) closeOverlay();
});

/* ========= LOGIN (dùng đúng credential như login.js) ========= */
const btnLogin = $("#btn-login");
btnLogin?.addEventListener("click", ()=>{
  const u = $("#login-username")?.value?.trim()?.toLowerCase();
  const p = $("#login-password")?.value;

  const found = [DEMO_USER, DEMO_ADMIN].find(c =>
    (u === c.email.toLowerCase() || u === c.username.toLowerCase()) && p === c.password
  );

  const err = $("#login-error");
  if(!found){
    if(err){ err.style.display="block"; err.textContent="Sai email/tài khoản hoặc mật khẩu."; }
    return;
  } else if(err){ err.style.display="none"; }

  // Set đủ key để guard ở các trang khác chấp nhận
  setAllAuth(found);

  // Cập nhật header & đóng modal (không auto chuyển trang)
  initAuthUI();
  closeOverlay();
});

// Enter để login
["login-username","login-password"].forEach(id=>{
  const el = document.getElementById(id);
  el?.addEventListener("keydown",(e)=>{ if(e.key==="Enter") btnLogin?.click(); });
});

/* ========= REGISTER (giống register.html: sau khi "đăng ký" thì mở luôn login) ========= */
$("#btn-register")?.addEventListener("click", ()=>{
  // TODO: gọi API tạo tài khoản nếu có
  openOverlay("login");
});

/* ========= USER MENU ========= */
function toggleUserMenu(e){
  e?.preventDefault?.();
  if(!userMenu) return;
  const open = userMenu.style.display === "" || userMenu.style.display === "block";
  userMenu.style.display = open ? "none" : "block";
  if(!open){
    document.addEventListener("click", onClickOutsideMenu, true);
    window.addEventListener("keydown", onMenuKeydown);
  }
}
function closeUserMenu(){
  if(!userMenu) return;
  userMenu.style.display = "none";
  document.removeEventListener("click", onClickOutsideMenu, true);
  window.removeEventListener("keydown", onMenuKeydown);
}
function onClickOutsideMenu(e){
  if(!userMenu.contains(e.target) && e.target !== avatarBtn){
    closeUserMenu();
  }
}
function onMenuKeydown(e){
  if(e.key === "Escape") closeUserMenu();
}

avatarBtn?.addEventListener("click", toggleUserMenu);

/* Đăng xuất */
$("#logout-btn")?.addEventListener("click", ()=>{
  if(confirm("Bạn chắc chắn muốn đăng xuất?")){
    clearAllAuth();
    initAuthUI();
    closeUserMenu();
  }
});

/* ========= Khởi tạo ========= */
initAuthUI();
