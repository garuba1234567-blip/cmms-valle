// =========================
// CMMS VALLE - APP.JS FULL
// =========================

const LANG = {
  es: {
    // LOGIN
    title: "Corporación del Valle Metropolitano",
    subtitle: "Acceso al sistema",
    user: "Usuario",
    pass: "Contraseña",
    login: "Ingresar",
    placeholderUser: "Ej: admin",
    placeholderPass: "1234",

    // DASHBOARD
    dashboard: "Dashboard",
    orders: "Órdenes",
    machines: "Máquinas",
    notifications: "Notificaciones",

    totalOrders: "Órdenes totales",
    pending: "Pendientes",
    inProgress: "En proceso",
    done: "Finalizadas",
    late: "Atrasadas",

    recentOrders: "Órdenes recientes",
    createOrder: "Nueva orden",
    quickAlerts: "Alertas rápidas",
    calendar: "Calendario",

    // FORM
    type: "Tipo",
    priority: "Prioridad",
    date: "Fecha",
    description: "Descripción",
    area: "Área",

    // BOTONES
    view: "Ver",
    delete: "Eliminar",

    // TIPOS
    preventive: "Preventivo",
    corrective: "Correctivo",
    emergency: "Emergencia",

    // PRIORIDAD
    late: "Atrasado",
    medium: "Media",
    high: "Alta",
    critical: "Crítica",
    paused: "Pausado",
    appName: "CMMS Valle",
    appSubtitle: "Corporación del Valle Metropolitano",
    footerCopy: "CMMS de mantenimiento • versión 1.0",
    logout: "Cerrar sesión",
    selectArea: "Seleccione un área",
    registeredMachines: "Máquinas registradas",
    charts: "Gráficos",
    exportCsv: "Exportar CSV",
    ordersPerDay: "Órdenes por día",
    takenAvgTime: "Tiempo promedio (tomadas)",
    takenCount: "Órdenes tomadas",
    completedCount: "Órdenes finalizadas",
    pendingCount: "Órdenes pendientes",
    lateOrders: "Órdenes atrasadas",
    techLoad: "Órdenes por técnico",
    avgResolutionHours: "Promedio horas (creación → ahora)",
    exportCsv: "Exportar CSV",
    topFailingMachines: "Máquinas con más fallas",
    workOrdersByArea: "Órdenes por área",
    monthlyOrders: "Órdenes mensuales"
  },

  zh: {
    title: "山谷大都会公司",
    subtitle: "系统登录",
    user: "用户",
    pass: "密码",
    login: "登录",
    placeholderUser: "例如：admin",
    placeholderPass: "1234",

    dashboard: "仪表板",
    orders: "工单",
    machines: "机器",
    notifications: "通知",

    totalOrders: "工单总数",
    pending: "待处理",
    inProgress: "进行中",
    done: "已完成",
    late: "逾期",
    paused: "暂停",
    inProgress: "进行中",
    pending: "待处理",

    recentOrders: "最近工单",
    createOrder: "新建工单",
    quickAlerts: "快速警报",
    calendar: "日历",

    type: "类型",
    priority: "优先级",
    date: "日期",
    description: "描述",
    area: "区域",

    view: "查看",
    delete: "删除",

    preventive: "预防性",
    corrective: "纠正性",
    emergency: "紧急",

    low: "低",
    medium: "中",
    high: "高",
    critical: "关键",
    appName: "CMMS 山谷",
    appSubtitle: "山谷大都会公司",
    footerCopy: "维护管理系统 • 版本 1.0",
    logout: "退出登录",
    selectArea: "选择区域",
    registeredMachines: "已注册的机器",
    charts: "图表",
    exportCsv: "导出 CSV",
    ordersPerDay: "每日工单",
    takenAvgTime: "平均处理时间",
    takenCount: "已接单",
    completedCount: "已完成",
    pendingCount: "待处理",
    lateOrders: "逾期工单",
    techLoad: "技术员工单数",
    avgResolutionHours: "平均小时（创建→现在）",
    topFailingMachines: "故障最多的机器",
    workOrdersByArea: "按区域的工单",
    monthlyOrders: "每月工单"
  }
};
let currentLang = localStorage.getItem("lang") || "es";
console.log("APP CARGANDO...");

function t(key) {
  return LANG[currentLang][key] || key;
}
async function autoTranslate(text) {
  if (!text) return "";

  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text,
        target: "zh-CN"
      })
    });

    const data = await res.json();
    return data.translated || text;

  } catch (err) {
    console.error("Error traduciendo:", err);
    return text;
  }
}
function translateMachineName(name) {
  if (currentLang !== "zh") return name;

  const map = {
    "maquina de nieves": "制冰机",
    "Compresor Atlas 01": "压缩机 Atlas 01",
    "Banda Transportadora 02": "传送带 02",
    "maquina de jarras": "罐装机"
  };

  return map[name] || name;
}
function translateMachineStatus(status) {
  if (currentLang !== "zh") return status;

  const map = {
    "Operativa": "运行中",
    "Fuera de servicio": "停用",
    "Mantenimiento": "维护中"
  };

  return map[status] || status;
}
function translateUI() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (LANG[currentLang][key]) {
      el.textContent = LANG[currentLang][key];
    }
  });
}
const DEMO_USERS = {
  admin: { password: "1234", role: "admin", name: "Administrador General" },
  tecnico: { password: "1234", role: "tecnico", name: "Técnico de Mantenimiento" },
  coordinador: { password: "1234", role: "coordinador", name: "Coordinador de Mantenimiento" },
};

const TECHNICIANS = [
  "Carlos Rojas",
  "María Vargas",
  "Luis Méndez",
  "Andrés Soto"
];
const MACHINES = [];
const USE_FIREBASE_AUTH = true;
// Normaliza roles escritos distinto en Firestore ("cordinador", mayúsculas, etc.)
function normalizeRole(r) {
  if (!r) return "tecnico";

  const v = String(r).trim().toLowerCase();

  if (v === "admin") return "admin";
  if (v === "coordinador" || v === "cordinador") return "coordinador";
  if (v === "tecnico" || v === "técnico") return "tecnico";

  console.warn("ROL NO RECONOCIDO:", r);

  return "tecnico";
}

// Extrae role/name incluso si el documento está mal guardado como string JSON
function extractRoleAndName(data, fallbackName) {
  let role = data?.role || data?.rol || null;
  let name = data?.name || data?.nombre || fallbackName || "Usuario";

  if (!role && data) {
    // Si alguien guardó todo el JSON como clave
    const maybeJsonKey = Object.keys(data).find(k => k.includes("\"role\"") || k.includes("role"));
    if (maybeJsonKey) {
      try {
        const parsed = JSON.parse(maybeJsonKey);
        role = parsed.role || role;
        name = parsed.name || name;
      } catch {
        // ignora parse error
      }
    }
  }

  return {
    role: normalizeRole(role || "tecnico"),
    name
  };
}

async function roleFromClaims(user) {
  try {
    const token = await user.getIdTokenResult();
    const claimRole = token?.claims?.role || token?.claims?.customRole;
    return normalizeRole(claimRole);
  } catch (err) {
    console.warn("No se pudo leer role de claims, usando default técnico:", err);
    return "tecnico";
  }
}

let currentUser = null;
let orders = [];
let unsubscribeOrders = null;
let previousOrderIds = new Set();

function listenOrdersRealtime() {
  try {
    // Evita duplicar listeners si el usuario inicia sesión varias veces
    if (typeof unsubscribeOrders === "function") {
      unsubscribeOrders();
      unsubscribeOrders = null;
    }

    const ordersRef = window.db.collection("orders");

    unsubscribeOrders = ordersRef.onSnapshot(
      (snapshot) => {
        const incoming = snapshot.docs.map(doc => ({
          id: doc.id, // string
          ...doc.data()
        }));
        incoming.forEach(o => {
          ensureOrderTranslation(o);
        });
        orders = incoming;

    // 🔥 traducir después de guardar
    orders.forEach((o, i) => {
      setTimeout(() => ensureOrderTranslation(o), i * 200);
    });

    // Forzar re-render según idioma actual
    renderAllViews();
        // Notificación a técnicos cuando llega algo nuevo asignado a ellos
        if (currentUser && currentUser.role === "tecnico") {
          const newOnes = incoming.filter(o =>
            !previousOrderIds.has(o.id) &&
            (
              !o.assignedTo ||
              o.assignedTo === "Técnico de Mantenimiento" ||
              o.assignedTo === currentUser.name
            )
          );
          if (newOnes.length > 0) {
            showToast(`Tienes ${newOnes.length} nueva(s) orden(es)`, "info");
          }
        }

        orders = incoming;
        previousOrderIds = new Set(incoming.map(o => o.id));

        console.log("Órdenes actualizadas desde Firebase:", orders.length);
        // Si estamos en chino, traduce dataset antes de renderizar
        if (currentLang === "zh") {
          translateAllDataIfNeeded();
        }
        renderAll();
      },
      (error) => {
        console.error("Error en realtime de órdenes:", error);
        showToast("No se pueden leer órdenes (permisos)", "error");
      }
    );
  } catch (err) {
    console.error("listenOrdersRealtime falló:", err);
    showToast("No se pudo iniciar sincronización en tiempo real", "error");
  }
}

let notifications = JSON.parse(localStorage.getItem("cmms_notifications") || "[]");
let calendar = null;
let currentModalOrderId = null;

// =========================
// DOM
// =========================
const loginScreen = document.getElementById("loginScreen");
const appRoot = document.getElementById("appRoot");
const loginForm = document.getElementById("loginForm");
const loginUser = document.getElementById("loginUser");
const loginPass = document.getElementById("loginPass");

const userName = document.getElementById("userName");
const userRole = document.getElementById("userRole");
const userAvatar = document.getElementById("userAvatar");

const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const mobileOverlay = document.getElementById("mobileOverlay");

const navItems = document.querySelectorAll(".nav-item");
const viewTitle = document.getElementById("viewTitle");
const viewSubtitle = document.getElementById("viewSubtitle");
const navCharts = document.getElementById("navCharts");

const logoutBtn = document.getElementById("logoutBtn");
const copyIpBtn = document.getElementById("copyIpBtn");
const serverIp = document.getElementById("serverIp");

const orderForm = document.getElementById("orderForm");
const orderMachine = document.getElementById("orderMachine");
const orderAssigned = document.getElementById("orderAssigned");
const orderArea = document.getElementById("orderArea");

const dashboardOrders = document.getElementById("dashboardOrders");
const ordersList = document.getElementById("ordersList");
const machinesList = document.getElementById("machinesList");
const alertsBox = document.getElementById("alertsBox");

const filterStatus = document.getElementById("filterStatus");
const filterType = document.getElementById("filterType");

const notificationsList = document.getElementById("notificationsList");
const notifBadge = document.getElementById("notifBadge");
const topNotifBadge = document.getElementById("topNotifBadge");
const topNotifBtn = document.getElementById("topNotifBtn");
const markAllReadBtn = document.getElementById("markAllReadBtn");

const orderModal = document.getElementById("orderModal");
const modalBody = document.getElementById("modalBody");
const closeModalBtn = document.getElementById("closeModalBtn");

const statTotal = document.getElementById("statTotal");
const statPending = document.getElementById("statPending");
const statInProgress = document.getElementById("statInProgress");
const statDone = document.getElementById("statDone");
const statLate = document.getElementById("statLate");
const statMachines = document.getElementById("statMachines");

// =========================
// INIT
// =========================
function applyTranslations() {
  const langData = LANG[currentLang];
  if (!langData) return;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (langData[key]) el.textContent = langData[key];
  });

  const loginUserEl = document.getElementById("loginUser");
  const loginPassEl = document.getElementById("loginPass");
  if (loginUserEl) loginUserEl.placeholder = langData.placeholderUser;
  if (loginPassEl) loginPassEl.placeholder = langData.placeholderPass;
}

// Re-render global UI to reflect the active language
function renderAllViews() {
  if (typeof renderAll === "function") renderAll();
  if (typeof renderMachines === "function") renderMachines();
  if (typeof renderDashboardOrders === "function") renderDashboardOrders();
  if (document.getElementById("view-charts")?.classList.contains("active")) {
    renderCharts();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("APP CARGANDO...");

  // 🔥 idioma inicial
  currentLang = localStorage.getItem("lang") || "es";

  // 🔥 cargar selects primero
  fillSelects();

  // 🔥 aplicar idioma base
  applyTranslations();

  // 🔥 render UI
  if (typeof renderAll === "function") renderAll();

  // 🔥 FIX FINAL (MUY IMPORTANTE)
    setTimeout(() => {
      applyTranslations();
      if (typeof renderAll === "function") renderAll();

      // 👉 solo si es chino usa IA
      if (currentLang === "zh" && typeof translateUI === "function") {
        translateUI();
      }
      translateAllDataIfNeeded();
    }, 200);

  // ===== BOTÓN IDIOMA =====
  const langToggle = document.getElementById("langToggle");
  if (langToggle) {
    langToggle.textContent = currentLang === "es" ? "ES" : "中文";

    langToggle.addEventListener("click", () => {
      // 🔥 cambiar idioma
      currentLang = currentLang === "es" ? "zh" : "es";
      localStorage.setItem("lang", currentLang);

      // 🔥 actualizar botón
      langToggle.textContent = currentLang === "es" ? "ES" : "中文";

      // 🔥 limpiar cache si existe
      if (typeof uiCache !== "undefined") {
        Object.keys(uiCache).forEach((k) => delete uiCache[k]);
      }

      // 🔥 traducir TODO
      applyTranslations();

      // 🔥 actualizar selects (MUY IMPORTANTE)
      if (typeof fillSelects === "function") fillSelects();

      // 🔥 render UI completa
      renderAllViews();

      // 🔥 CALENDARIO (AQUÍ VA)
      if (calendar) {
        calendar.destroy();
        calendar = null;
        initCalendar();
      }

      // 🤖🔥 IA TRADUCCIÓN (LO QUE TE FALTABA)
      setTimeout(() => {
        if (currentLang === "zh" && typeof translateUI === "function") {
          translateUI();
        }
        translateAllDataIfNeeded(); // traduce dataset según idioma actual
      }, 200);
    });
  }

  // ===== ELEMENTOS =====
  const btnNewMachine = document.getElementById("btnNewMachine");
  const machineModal = document.getElementById("machineModal");
  const closeMachineModal = document.getElementById("closeMachineModal");
  const machineForm = document.getElementById("machineForm");

  // Mostrar Charts en el menú (visible para todos por simplicidad)
  if (navCharts) {
    navCharts.style.display = "block";
  }

  // ===== MODAL =====
  if (btnNewMachine && machineModal) {
    btnNewMachine.addEventListener("click", () => {
      machineModal.classList.add("show");
    });
  }

  if (closeMachineModal && machineModal) {
    closeMachineModal.addEventListener("click", () => {
      machineModal.classList.remove("show");
    });
  }

  if (machineModal) {
    machineModal.addEventListener("click", (e) => {
      if (e.target === machineModal) machineModal.classList.remove("show");
    });
  }

  if (machineForm && typeof handleCreateMachine === "function") {
    machineForm.addEventListener("submit", handleCreateMachine);
  }

  // ===== EVENTOS =====
  if (typeof bindEvents === "function") bindEvents();

  // ===== FIREBASE =====
  if (
    typeof USE_FIREBASE_AUTH !== "undefined" &&
    USE_FIREBASE_AUTH &&
    window.firebase &&
    firebase.auth
  ) {
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.NONE);

    firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {
        if (typeof loadUserProfile === "function") await loadUserProfile(user);

        if (loginScreen) loginScreen.classList.add("hidden");
        if (appRoot) appRoot.classList.remove("hidden");

        if (typeof applyUserUI === "function") applyUserUI();
        if (typeof initCalendar === "function") initCalendar();
        if (typeof listenMachinesRealtime === "function") listenMachinesRealtime();
        if (typeof fillSelects === "function") fillSelects();
        if (typeof listenOrdersRealtime === "function") listenOrdersRealtime();
        if (typeof renderAll === "function") renderAll();
        if (typeof refreshCalendar === "function") refreshCalendar();
        // Mostrar menú de gráficos solo para admin; si no hay claim, se muestra para todos.
        if (navCharts) {
          const isAdmin = currentUser && currentUser.role === "admin";
          navCharts.style.display = isAdmin ? "block" : "none";
        }
      } else {
        currentUser = null;
        if (loginScreen) loginScreen.classList.remove("hidden");
        if (appRoot) appRoot.classList.add("hidden");
      }
    });
  }
});




// ===== MACHINE MODAL =====

// cerrar modal botón
if (closeMachineModal) {
  closeMachineModal.addEventListener("click", () => {
    machineModal.classList.remove("show");
  });
}

// cerrar clic afuera
if (machineModal) {
  machineModal.addEventListener("click", (e) => {
    if (e.target === machineModal) {
      machineModal.classList.remove("show");
    }
  });
}

// submit form
if (machineForm) {
  machineForm.addEventListener("submit", handleCreateMachine);
}

// ===== RESTO DE TU APP =====

if (typeof bindEvents === "function") {
  bindEvents();
}

function bindEvents() {

  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  if (menuToggle) {
    menuToggle.addEventListener("click", toggleSidebar);
  }

  if (mobileOverlay) {
    mobileOverlay.addEventListener("click", closeSidebar);
  }

  if (navItems && navItems.length) {
    navItems.forEach(btn => {
      btn.addEventListener("click", () => {
        const view = btn.dataset.view;
        setActiveView(view);
        if (window.innerWidth <= 980) closeSidebar();
      });
    });
  }

  if (orderForm) {
    orderForm.addEventListener("submit", handleCreateOrder);
  }

  if (filterStatus) {
    filterStatus.addEventListener("change", renderAll);
  }

  if (filterType) {
    filterType.addEventListener("change", renderAll);
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeModal);
  }

  if (orderModal) {
    orderModal.addEventListener("click", (e) => {
      if (e.target === orderModal) closeModal();
    });
  }

  if (topNotifBtn) {
    topNotifBtn.addEventListener("click", () => setActiveView("notifications"));
  }

  if (markAllReadBtn) {
    markAllReadBtn.addEventListener("click", markAllNotificationsRead);
  }

  if (copyIpBtn) {
    copyIpBtn.addEventListener("click", copyIpToClipboard);
  }

}

// =========================
// LOGIN MEJORADO
// =========================
function handleLogin(e) {
  e.preventDefault();

  console.log("Intentando login...");

  const user = loginUser.value.trim();
  const pass = loginPass.value.trim();

  if (USE_FIREBASE_AUTH && window.firebase && firebase.auth) {
    firebase.auth().signInWithEmailAndPassword(user, pass)
      .then(async (cred) => {
        await loadUserProfile(cred.user);
        loginScreen.classList.add("hidden");
        appRoot.classList.remove("hidden");
        applyUserUI();
        initCalendar();
        listenMachinesRealtime();
        fillSelects();
        listenOrdersRealtime();
        renderAll();
        refreshCalendar();
        askNotificationPermission();
        if (currentUser) {
          showToast(`Bienvenido ${currentUser.name}`, "success");
        }
      })
      .catch((err) => {
        console.error("Login Firebase falló:", err);
        showToast(err.message || "Error de login", "error");
      });
    return;
  }

  // Demo local (si se desactiva Firebase Auth)
  const userKey = user.toLowerCase();
  if (!DEMO_USERS[userKey]) {
    showToast("Usuario no encontrado", "warning");
    return;
  }
  if (DEMO_USERS[userKey].password !== pass) {
    showToast("Contraseña incorrecta", "warning");
    return;
  }
  currentUser = {
    username: userKey,
    role: DEMO_USERS[userKey].role,
    name: DEMO_USERS[userKey].name
  };
  loginScreen.classList.add("hidden");
  appRoot.classList.remove("hidden");
  applyUserUI();
  initCalendar();
  listenMachinesRealtime();
  fillSelects();
  listenOrdersRealtime();
  renderAll();
  refreshCalendar();
  askNotificationPermission();
  showToast(`Bienvenido ${currentUser.name}`, "success");
}
function logout() {
  currentUser = null;

  if (USE_FIREBASE_AUTH && window.firebase && firebase.auth) {
    firebase.auth().signOut();
  }

  // Cerrar listener realtime si existe
  if (typeof unsubscribeOrders === "function") {
    unsubscribeOrders();
    unsubscribeOrders = null;
  }

  localStorage.clear();

  loginScreen.classList.remove("hidden");
  appRoot.classList.add("hidden");

  showToast("Sesión cerrada", "info");
}

function applyUserUI() {
  if (!currentUser) return;

  userName.textContent = currentUser.name;
  userRole.textContent = formatRole(currentUser.role);
  userAvatar.textContent = currentUser.name.charAt(0).toUpperCase();

  // Técnico no puede crear órdenes
  if (currentUser.role === "tecnico") {
    orderForm.closest(".panel").style.display = "none";
  } else {
    orderForm.closest(".panel").style.display = "block";
  }

  // Solo admin ve botón de nuevas máquinas
  const btnNewMachine = document.getElementById("btnNewMachine");
  const machinePanelBtn = btnNewMachine ? btnNewMachine.closest("button") : null;
  if (btnNewMachine) {
    btnNewMachine.style.display = currentUser.role === "admin" ? "inline-flex" : "none";
  }
}

// =========================
// SIDEBAR MOBILE
// =========================
function toggleSidebar() {
  sidebar.classList.toggle("open");
  mobileOverlay.classList.toggle("show");
}

function closeSidebar() {
  sidebar.classList.remove("open");
  mobileOverlay.classList.remove("show");
}

// =========================
// VIEWS
// =========================
function setActiveView(view) {
  if (view === "charts") {
    renderCharts();
  }
  document.querySelectorAll(".view-section").forEach(v => v.classList.remove("active"));
  document.getElementById(`view-${view}`).classList.add("active");

  navItems.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });

  const titles = {
    dashboard: [t("dashboard"), ""],
    calendar: ["日历", ""],
    orders: [t("orders"), ""],
    machines: [t("machines"), ""],
    notifications: [t("notifications"), ""]
  };
  viewTitle.textContent = titles[view][0];
  viewSubtitle.textContent = titles[view][1];

  if (view === "notifications") {
    markNotificationsViewedByCurrentUser();
    renderNotifications();
  }

  if (view === "calendar" && calendar) {
    setTimeout(() => calendar.updateSize(), 100);
  }
}

// =========================
// DATA HELPERS
// =========================
function saveOrders() {
  localStorage.setItem("cmms_orders", JSON.stringify(orders));
}

function saveNotifications() {
  localStorage.setItem("cmms_notifications", JSON.stringify(notifications));
}

function generateId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function nowString() {
  return new Date().toLocaleString("es-CR");
}

function formatRole(role) {
  const r = normalizeRole(role);
  if (r === "admin") return "Administrador";
  if (r === "tecnico") return "Técnico";
  return "Coordinador";
}

function formatDateTime(dateStr, timeStr) {
  return `${dateStr} ${timeStr}`;
}

function isLate(order) {
  if (order.status === "Finalizado") return false;
  const due = new Date(`${order.date}T${order.time}`);
  return due.getTime() < Date.now();
}

// Carga perfil/rol del usuario autenticado desde Firestore
async function loadUserProfile(user) {
  if (!user || !window.db) {
    currentUser = null;
    return;
  }

  try {
    console.log("UID LOGIN:", user.uid);

    // Rol desde claims (evita fallar si Firestore bloquea)
    let role = await roleFromClaims(user);
    let name = user.email || "Usuario";

    // Rol/nombre desde Firestore si es posible
    const doc = await window.db.collection("users").doc(user.uid).get();
    if (doc.exists) {
      const data = doc.data();
      console.log("DATA FIRESTORE:", data);
      const extracted = extractRoleAndName(data, name);
      role = extracted.role || role;
      name = extracted.name || name;
    } else {
      console.warn("Usuario no existe en Firestore, se usan claims/default");
    }

    console.log("ROL FINAL:", role);

    currentUser = {
      uid: user.uid,
      username: user.email,
      role: role,
      name: name
    };

  } catch (err) {
    console.error("ERROR PERFIL:", err);
    showToast("Usuario mal configurado en Firestore", "error");

    currentUser = {
      uid: user.uid,
      username: user.email,
      role: "tecnico",
      name: user.email || "Usuario"
    };
  }
}

function getVisibleOrdersForUser() {
  if (!currentUser) return [];

  // ADMIN VE TODO
  if (currentUser.role === "admin") {
    return orders;
  }

  // COORDINADOR Y TÉCNICO VEN TODO (OPERACIÓN EN RED)
  if (currentUser.role === "coordinador" || currentUser.role === "tecnico") {
    return orders;
  }

  return [];
}
async function ensureOrderTranslation(order) {
  try {
    // 🔥 solo traducir si estás en chino
    if (currentLang !== "zh") return;

    // 🔥 evitar repetir solo si ya hay chino real
    const hasChinese = (txt) => /[\u4e00-\u9fff]/.test(txt || "");
    if (
      hasChinese(order.title_zh) &&
      hasChinese(order.machine_zh) &&
      hasChinese(order.description_zh) &&
      hasChinese(order.type_zh) &&
      hasChinese(order.priority_zh)
    ) return;

    const title = order.title || "";
    const machine = order.machine || "";
    const description = order.description || "";
    const type = order.type || "";
    const priority = order.priority || "";
    const area = order.area || "";

    // 🔥 evitar llamadas inútiles
    if (!title && !machine && !description && !type && !priority && !area) return;

    const title_zh = title ? await autoTranslate(title) : "";
    const machine_zh = machine ? await autoTranslate(machine) : "";
    const description_zh = description ? await autoTranslate(description) : "";
    const type_zh = type ? await autoTranslate(type) : "";
    const priority_zh = priority ? await autoTranslate(priority) : "";
    const area_zh = area ? await autoTranslate(area) : "";

    // Siempre guardamos en memoria para render inmediato
    order.title_zh = title_zh;
    order.machine_zh = machine_zh;
    order.description_zh = description_zh;
    order.type_zh = type_zh;
    order.priority_zh = priority_zh;
    order.area_zh = area_zh;

    // Si hay Firebase disponible, persistimos
    if (window.db && order.id) {
      await window.db.collection("orders").doc(order.id).update({
        title_zh,
        machine_zh,
        description_zh,
        type_zh,
        priority_zh,
        area_zh
      });
      console.log("✅ Orden traducida:", order.id);
    }

    // Re-render para reflejar traducción sin esperar otro snapshot
    if (typeof renderAll === "function") {
      setTimeout(() => renderAll(), 0);
    }

  } catch (err) {
    console.warn("❌ Error traduciendo orden:", err);
  }
}
async function ensureMachineTranslation(machine) {
  try {
    if (currentLang !== "zh") return;

    // Si ya hay name_zh en chino, dejamos pasar.
    if (machine.name_zh && /[\u4e00-\u9fff]/.test(machine.name_zh)) return;

    const name = machine.name || "";
    if (!name) return;

    const name_zh = await autoTranslate(name);

    // cache local para mostrar aunque no se pueda guardar
    machine.name_zh = name_zh;

    if (window.db && machine.id) {
      await window.db.collection("machines").doc(machine.id).update({
        name_zh
      });
      console.log("✅ Máquina traducida:", machine.id);
    }

    // Re-render para que la UI tome el valor sin esperar otro snapshot
    if (typeof renderMachines === "function") renderMachines();

  } catch (err) {
    console.warn("❌ Error traduciendo máquina:", err);
  }
}

// Traduce nota al vuelo si estamos en chino; cache simple por texto original
const noteCache = {};
function formatNote(note) {
  if (currentLang !== "zh") return note;
  if (!note) return "";

  if (noteCache[note]) return noteCache[note];

  // dispara traducción asíncrona y luego re-render
  autoTranslate(note)
    .then((translated) => {
      noteCache[note] = translated;
      if (typeof renderAll === "function") renderAll();
    })
    .catch(() => { /* ignore */ });

  return note; // mientras tanto muestra original
}

// Traduce en bloque todas las órdenes y máquinas cuando el usuario cambia a chino.
async function translateAllDataIfNeeded() {
  if (currentLang !== "zh") return;

  try {
    if (Array.isArray(orders)) {
      for (const o of orders) {
        await ensureOrderTranslation(o);
      }
    }

    if (Array.isArray(machinesFirebase)) {
      for (const m of machinesFirebase) {
        await ensureMachineTranslation(m);
      }
    }

    // Re-render tras traducir dataset completo
    renderAllViews();
  } catch (err) {
    console.warn("No se pudo traducir todo el dataset:", err);
  }
}

// =========================
// DEMO DATA
// =========================
function seedDemoOrdersIfEmpty() {
  if (orders.length > 0) return;

  orders = [
    {
      id: generateId(),
      title: "Cambio de filtro de compresor",
      machine: "Compresor Atlas 01",
      assignedTo: "Técnico de Mantenimiento",
      type: "Preventivo",
      priority: "Alta",
      status: "Pendiente",
      date: getTodayOffset(1),
      time: "09:00",
      description: "Cambio programado de filtro y revisión general.",
      history: [`Orden creada - ${nowString()}`],
      notes: []
    },
    {
      id: generateId(),
      title: "Revisión de sensor en banda",
      machine: "Banda Transportadora 02",
      assignedTo: "Técnico de Mantenimiento",
      type: "Correctivo",
      priority: "Media",
      status: "En proceso",
      date: getTodayOffset(0),
      time: "14:30",
      description: "Sensor intermitente en línea de empaque.",
      history: [`Orden creada - ${nowString()}`, `Estado cambiado a En proceso - ${nowString()}`],
      notes: []
    },
    {
      id: generateId(),
      title: "Inspección de sistema de bombeo",
      machine: "Sistema de Bombeo 05",
      assignedTo: "Carlos Rojas",
      type: "Preventivo",
      priority: "Baja",
      status: "Pendiente",
      date: getTodayOffset(3),
      time: "08:00",
      description: "Chequeo de presión y sello mecánico.",
      history: [`Orden creada - ${nowString()}`],
      notes: []
    }
  ];

  saveOrders();
}

function getTodayOffset(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
}

// Normaliza claves para deduplicar nombres (sin acentos, minúsculas, trim, espacios simples)
function normalizeKey(str) {
  return (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

// Clave más estricta para nombres de máquinas (solo alfanumérico)
function machineKey(str) {
  return normalizeKey(str).replace(/[^a-z0-9]/g, "");
}

// =========================
// SELECTS
// =========================
async function fillSelects() {
  // ===== TIPOS Y PRIORIDADES =====
  const typeSelect = document.getElementById("orderType");
  const prioritySelect = document.getElementById("orderPriority");
  const areaSelect = document.getElementById("orderArea");

  if (typeSelect && prioritySelect) {

    const types = [
      { es: "Preventivo", zh: "预防性" },
      { es: "Correctivo", zh: "纠正性" },
      { es: "Emergencia", zh: "紧急" }
    ];

  const priorities = [
    { es: "Baja", zh: "低" },
    { es: "Media", zh: "中" },
    { es: "Alta", zh: "高" },
    { es: "Crítica", zh: "紧急" }
  ];

    // 🔹 LIMPIAR
    typeSelect.innerHTML = "";
    prioritySelect.innerHTML = "";

    // 🔹 LLENAR TIPOS
    types.forEach(t => {
      typeSelect.innerHTML += `
      <option value="${t.es}">
        ${currentLang === "zh" ? t.zh : t.es}
      </option>
    `;
    });

    // 🔹 LLENAR PRIORIDADES
    priorities.forEach(p => {
      prioritySelect.innerHTML += `
      <option value="${p.es}">
        ${currentLang === "zh" ? p.zh : p.es}
      </option>
    `;
    });
  }
  try {
    if (!orderMachine || !orderAssigned) {
      console.warn("No existen los selects de orden");
      return;
    }

    // Placeholders (solo placeholders, sin datos locales)
    const phMachine = currentLang === "zh" ? "选择机器" : "Seleccione una máquina";
    const phTech = currentLang === "zh" ? "选择技术员" : "Seleccione un técnico";
    orderMachine.innerHTML = `<option value="">${phMachine}</option>`;
    orderAssigned.innerHTML = `<option value="">${phTech}</option>`;

    // Solo cargar cuando hay usuario logueado
    if (!currentUser) {
      console.warn("fillSelects: sin currentUser, se dejan placeholders");
      return;
    }

    if (!window.db) {
      console.warn("Firebase no inicializado; no se cargarán máquinas/técnicos");
      return;
    }

    // ===== MÁQUINAS SOLO DESDE FIREBASE (collection machines) =====
    if (Array.isArray(machinesFirebase) && machinesFirebase.length) {
      // Poblar áreas
      if (areaSelect) {
        areaSelect.innerHTML = `<option value="">${t("selectArea") || "Seleccione un área"}</option>`;
        const seenAreas = new Set();
        machinesFirebase.forEach(m => {
          const area = (m.area || "").trim();
          const key = normalizeKey(area);
          if (!key || seenAreas.has(key)) return;
          seenAreas.add(key);
          areaSelect.innerHTML += `<option value="${area}">${area}</option>`;
        });

        // Listener: al cambiar área, poblar máquinas de esa área
        areaSelect.onchange = () => populateMachinesForArea(areaSelect.value);
      }

      populateMachinesForArea(areaSelect ? areaSelect.value : "");
    } else {
      console.warn("machinesFirebase vacío; no se cargan máquinas en el select");
    }

    if (orderMachine.options.length === 1) { // solo placeholder
      orderMachine.innerHTML += `<option value="">${currentLang === "zh" ? "无机器" : "No hay máquinas registradas"}</option>`;
    }

    // ===== TÉCNICOS DESDE FIREBASE =====
    // Ajusta "users" si tu colección real se llama diferente
    let techSnap;
    try {
      techSnap = await window.db.collection("users").get();
    } catch (err) {
      console.error("Error leyendo users en Firestore:", err);
      techSnap = { empty: true, forEach: () => { } };
    }

    // Opción de disponibilidad
    orderAssigned.innerHTML += `<option value="Disponible">${currentLang === "zh" ? "可用" : "Disponible"}</option>`;

    let techsFound = 0;

    if (!techSnap.empty) {
      techSnap.forEach(doc => {
        const user = doc.data();

        // Solo usuarios con rol técnico
        if (user.role === "tecnico" || user.rol === "tecnico") {
          const techName =
            user.name ||
            user.nombre ||
            user.username ||
            `Técnico ${doc.id}`;

          orderAssigned.innerHTML += `<option value="${techName}">${techName}</option>`;
          techsFound++;
        }
      });
    }

    // Si no encontró técnicos en Firebase, deja solo placeholder + Disponible

    console.log("Selects cargados correctamente");
  } catch (err) {
    console.error("Error cargando selects (bloque externo):", err);

    orderMachine.innerHTML = `<option value="">${phMachine}</option>`;
    orderAssigned.innerHTML = `<option value="">${phTech}</option>`;
    showToast("No se pudieron cargar máquinas/técnicos desde Firebase", "warning");
  }
}

function populateMachinesForArea(areaValue) {
  if (!orderMachine) return;

  const phMachine = currentLang === "zh" ? "选择机器" : "Seleccione una máquina";
  orderMachine.innerHTML = `<option value="">${phMachine}</option>`;

  if (!Array.isArray(machinesFirebase) || !machinesFirebase.length) return;

  const seenKey = new Set();
  machinesFirebase.forEach(m => {
    const area = (m.area || "").trim();
    if (areaValue && normalizeKey(area) !== normalizeKey(areaValue)) return;

    const name = m.name || m.nombre || m.title || `Máquina ${m.id || ""}`.trim();
    const key = machineKey(name);
    if (!key || seenKey.has(key)) return;
    seenKey.add(key);
    orderMachine.innerHTML += `<option value="${name}">${name}</option>`;
  });
}

// =========================
// CREATE ORDER
// =========================
async function handleCreateOrder(e) {
  e.preventDefault();

  if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "coordinador")) {
    showToast("No tienes permiso para crear órdenes", "warning");
    return;
  }

  const type = document.getElementById("orderType").value;
  const priority = document.getElementById("orderPriority").value;
  const title = document.getElementById("orderTitle").value.trim();
  const description = document.getElementById("orderDescription").value.trim();
  const machine = document.getElementById("orderMachine").value;
  const area = document.getElementById("orderArea") ? document.getElementById("orderArea").value : "";

  if (!area) {
    showToast("Selecciona un área", "warning");
    return;
  }

  // 🔥 TRADUCCIÓN COMPLETA
  const [title_zh, description_zh, machine_zh, type_zh, priority_zh, area_zh] = await Promise.all([
    autoTranslate(title),
    autoTranslate(description),
    autoTranslate(machine),
    autoTranslate(type),
    autoTranslate(priority),
    autoTranslate(area)
  ]);

  const newOrder = {
    id: generateId(),
    title,
    title_zh,
    description,
    description_zh,
    machine,
    machine_zh,
    type,
    type_zh,
    priority,
    priority_zh,
    area,
    area_zh,
    assignedTo: document.getElementById("orderAssigned").value,
    date: document.getElementById("orderDate").value,
    time: document.getElementById("orderTime").value,
    status: "Pendiente"
  };

  try {
    if (window.db) {
      const docRef = await window.db.collection("orders").add({
        ...newOrder,
        status: "Pendiente",
        createdAt: new Date().toISOString(),
        creadoPor: currentUser.uid || currentUser.username,
        creadorNombre: currentUser.name,
        history: [`Orden creada - ${nowString()}`],
        notes: []
      });

      newOrder.id = docRef.id;

      // Traducir y guardar campos zh (por si la llamada anterior falló)
      ensureOrderTranslation({ ...newOrder });

      // Notificación interna
      createAssignmentNotification({
        ...newOrder,
        id: newOrder.id
      });

      showToast("Orden creada en Firebase 🔥", "success");
    } else {
      // Sin Firebase: guarda en memoria para no bloquear la UI
      const offlineOrder = {
        ...newOrder,
        createdAt: new Date().toISOString(),
        history: [`Orden creada - ${nowString()}`],
        notes: []
      };
      orders.push(offlineOrder);
      ensureOrderTranslation(offlineOrder);
      showToast("Orden creada (local)", "info");
    }

    orderForm.reset();
    document.getElementById("orderDate").value = getTodayOffset(0);

    // Refresco manual visual (aunque el realtime debería entrar)
    setTimeout(() => {
      if (typeof renderAll === "function") renderAll();
    }, 300);

  } catch (err) {
    console.error(err);
    showToast("Error guardando en Firebase", "error");
  }
}
// =========================
// RENDER ALL
// =========================


function renderAll() {
  renderStats();
  renderDashboardOrders();
  renderOrdersList();
  renderMachines();
  renderAlerts();
  renderNotifications();
  refreshCalendar();


}
function renderAlerts() {
  if (!alertsBox) return;

  const lateOrders = getVisibleOrdersForUser().filter(isLate);

  if (!lateOrders.length) {
    alertsBox.innerHTML = `<div>${t("noAlerts")}</div>`;
    return;
  }

  alertsBox.innerHTML = lateOrders.map(order => `
    <div class="record-card atrasado">
     <p class="record-title">${translateMachineName(order.title)}</p>
<p class="record-sub">${translateMachineName(order.machine)} • ${order.assignedTo}</p>
      <div class="badges">
        <span class="badge atrasado">${t("late")}</span>
      </div>
    </div>
  `).join("");
}

function renderStats() {
  const visibleOrders = getVisibleOrdersForUser();

  statTotal.textContent = visibleOrders.length;
  statPending.textContent = visibleOrders.filter(o => o.status === "Pendiente").length;
  statInProgress.textContent = visibleOrders.filter(o => o.status === "En proceso" || o.status === "Pausado").length;
  statDone.textContent = visibleOrders.filter(o => o.status === "Finalizado").length;
  statLate.textContent = visibleOrders.filter(isLate).length;
  statMachines.textContent = machinesFirebase.length;
}

function renderCharts() {
  const container = document.getElementById("chartsContent");
  if (!container) return;

  const ordersByDay = {};
  const techLoad = {};
  const now = new Date();
  const toDate = (d, t) => new Date(`${d || "1970-01-01"}T${t || "00:00"}`);

  orders.forEach(o => {
    const d = o.date || "";
    if (d) ordersByDay[d] = (ordersByDay[d] || 0) + 1;

    const tech = o.assignedTo || "N/D";
    techLoad[tech] = (techLoad[tech] || 0) + 1;
  });

  const taken = orders.filter(o => o.status === "En proceso" || o.status === "Pausado");
  const done = orders.filter(o => o.status === "Finalizado");
  const pending = orders.filter(o => o.status === "Pendiente");

  // Órdenes atrasadas (fecha anterior a hoy y no finalizada)
  const today = new Date().toISOString().split("T")[0];
  const late = orders
    .filter(o => o.status !== "Finalizado" && o.date && o.date < today)
    .map(o => {
      const diffDays = Math.ceil((new Date() - new Date(o.date)) / 86400000);
      return { ...o, diffDays };
    });

  // Promedio horas desde creación hasta ahora (si hay createdAt)
  const durations = orders
    .map(o => {
      if (!o.createdAt) return null;
      const start = new Date(o.createdAt);
      const end = o.completedAt ? new Date(o.completedAt) : now;
      return (end - start) / 36e5; // hours
    })
    .filter(v => v !== null);
  const avgHours = durations.length ? (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1) : "-";

  const chart1 = `
    <div class="chart-card">
      <h4>${t("ordersPerDay") || "Órdenes por día"}</h4>
      <ul>
        ${Object.entries(ordersByDay).map(([d, n]) => `<li>${d}: ${n}</li>`).join("") || "<li>Sin datos</li>"}
      </ul>
    </div>
  `;

  const chart2 = `
    <div class="chart-card">
      <h4>${t("takenCount") || "Órdenes tomadas"}</h4>
      <p>${taken.length}</p>
      <h4>${t("completedCount") || "Órdenes finalizadas"}</h4>
      <p>${done.length}</p>
      <h4>${t("pendingCount") || "Órdenes pendientes"}</h4>
      <p>${pending.length}</p>
      <h4>${t("lateOrders") || "Órdenes atrasadas"}</h4>
      <p>${late.length}</p>
      <h4>${t("avgResolutionHours") || "Promedio horas"}</h4>
      <p>${avgHours}</p>
    </div>
  `;

  const chart3 = `
    <div class="chart-card">
      <h4>${t("techLoad") || "Órdenes por técnico"}</h4>
      <ul>
        ${Object.entries(techLoad).map(([tech, n]) => `<li>${tech}: ${n}</li>`).join("") || "<li>Sin datos</li>"}
      </ul>
    </div>
  `;

  // Máquinas con más fallas (máx 5)
  const machineCount = {};
  orders.forEach(o => {
    const key = machineKey(o.machine || "");
    if (!key) return;
    machineCount[key] = (machineCount[key] || { name: o.machine, count: 0 });
    machineCount[key].count += 1;
  });
  const topMachines = Object.values(machineCount)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const chart4 = `
    <div class="chart-card">
      <h4>${t("topFailingMachines") || "Máquinas con más fallas"}</h4>
      <ul>
        ${topMachines.map(m => `<li>${m.name}: ${m.count}</li>`).join("") || "<li>Sin datos</li>"}
      </ul>
    </div>
  `;

  // Órdenes por área
  const areaCount = {};
  orders.forEach(o => {
    const a = o.area || "Sin área";
    areaCount[a] = (areaCount[a] || 0) + 1;
  });
  const chart5 = `
    <div class="chart-card">
      <h4>${t("workOrdersByArea") || "Órdenes por área"}</h4>
      <ul>
        ${Object.entries(areaCount).map(([a, n]) => `<li>${a}: ${n}</li>`).join("") || "<li>Sin datos</li>"}
      </ul>
    </div>
  `;

  // Órdenes mensuales (agrupadas por mes)
  const monthNames = ["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
  const monthly = new Array(12).fill(0);
  orders.forEach(o => {
    if (!o.date) return;
    const m = new Date(o.date).getMonth();
    monthly[m] += 1;
  });
  const chart6 = `
    <div class="chart-card">
      <h4>${t("monthlyOrders") || "Órdenes mensuales"}</h4>
      <ul>
        ${monthly.map((n, i) => `<li>${monthNames[i]}: ${n}</li>`).join("")}
      </ul>
    </div>
  `;

  // Bar visuals
  const makeBarRows = (entries) => {
    const max = Math.max(...entries.map(([, n]) => n), 1);
    return entries.map(([label, n]) => `
      <div class="bar-row">
        <span class="bar-label">${label}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${(n / max) * 100}%"></div></div>
        <span>${n}</span>
      </div>
    `).join("");
  };

  const barOrdersDay = `
    <div class="chart-card">
      <h4>${t("ordersPerDay") || "Órdenes por día"}</h4>
      <div class="bar-chart">
        ${makeBarRows(Object.entries(ordersByDay))}
      </div>
    </div>`;

  const barArea = `
    <div class="chart-card">
      <h4>${t("workOrdersByArea") || "Órdenes por área"}</h4>
      <div class="bar-chart">
        ${makeBarRows(Object.entries(areaCount))}
      </div>
    </div>`;

  const barMachines = `
    <div class="chart-card">
      <h4>${t("topFailingMachines") || "Máquinas con más fallas"}</h4>
      <div class="bar-chart">
        ${makeBarRows(topMachines.map(m => [m.name, m.count]))}
      </div>
    </div>`;

  const barLate = `
    <div class="chart-card">
      <h4>${t("lateOrders") || "Órdenes atrasadas"}</h4>
      <div class="bar-chart">
        ${makeBarRows(late.map(o => [o.title || o.id, o.diffDays]))}
      </div>
    </div>`;

  const barMonthly = `
    <div class="chart-card">
      <h4>${t("monthlyOrders") || "Órdenes mensuales"}</h4>
      <div class="bar-chart">
        ${makeBarRows(monthly.map((n, i) => [monthNames[i], n]))}
      </div>
    </div>`;

  container.innerHTML = chart2 + chart3 + chart4 + chart5 + chart6 + barOrdersDay + barArea + barMachines + barLate + barMonthly;

  const exportBtn = document.getElementById("exportCsvBtn");
  if (exportBtn) {
    exportBtn.onclick = () => exportOrdersCsv();
  }
}

function exportOrdersCsv() {
  const headers = ["id", "title", "machine", "area", "type", "priority", "status", "date", "time", "assignedTo", "createdAt", "isLate"];
  const today = new Date().toISOString().split("T")[0];
  const rows = orders.map(o => {
    const isLate = o.status !== "Finalizado" && o.date && o.date < today;
    return headers.map(h => `"${((h === "isLate" ? isLate : o[h]) || "").toString().replace(/"/g, '""')}"`).join(",");
  });
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "orders.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function translateStatus(status) {
  if (status === "Pendiente") return t("pending") || "Pendiente";
  if (status === "En proceso") return t("inProgress") || "En proceso";
  if (status === "Pausado") return t("paused") || "Pausado";
  if (status === "Finalizado") return t("done") || "Finalizado";
  return status;
}

// Mapas duros para asegurar chino aunque las claves de i18n falten
const STATUS_ZH = {
  "Pendiente": "待处理",
  "En proceso": "进行中",
  "Pausado": "暂停",
  "Finalizado": "完成"
};
const TYPE_ZH = {
  "Preventivo": "预防性",
  "Correctivo": "纠正性",
  "Emergencia": "紧急"
};
const PRIORITY_ZH = {
  "Baja": "低",
  "Media": "中",
  "Alta": "高",
  "Crítica": "关键",
  "Critica": "关键",
  "Atrasado": "逾期"
};

function forceStatusLabel(status) {
  if (currentLang === "zh") return STATUS_ZH[status] || translateStatus(status);
  return translateStatus(status);
}
function forceTypeLabel(type) {
  if (currentLang === "zh") return TYPE_ZH[type] || type;
  return type;
}
function forcePriorityLabel(priority) {
  if (currentLang === "zh") return PRIORITY_ZH[priority] || priority;
  return priority;
}

function renderDashboardOrders() {
  const visibleOrders = getVisibleOrdersForUser().slice(0, 8);

  // Si estamos en chino y falta traducción, asegúrala antes de pintar
  visibleOrders.forEach(o => {
    if (currentLang === "zh") {
      ensureOrderTranslation(o);
    }
  });

  if (!visibleOrders.length) {
    dashboardOrders.innerHTML = `<div class="record-card">${t("noOrders") || "No hay órdenes"}</div>`;
    return;
  }

  dashboardOrders.innerHTML = visibleOrders.map(orderCardHTML).join("");
  attachOrderButtons();
  relabelOrderButtons();
}
function orderCardHTML(order) {
  const late = isLate(order);
  const typeClass = order.type.toLowerCase();
  const extraClass = late ? "atrasado" : "";

  const actions = buildOrderActions(order);

  // 🔥 IDIOMA DINÁMICO (CLAVE)
  const type = currentLang === "zh"
    ? (order.type_zh || forceTypeLabel(order.type))
    : order.type;

  const priority = currentLang === "zh"
    ? (order.priority_zh || forcePriorityLabel(order.priority))
    : order.priority;

  // badges traducidas forzadas
  const statusLabel = forceStatusLabel(order.status);

  const title = currentLang === "zh"
    ? (order.title_zh || order.title)
    : order.title;

  const machine = currentLang === "zh"
    ? (order.machine_zh || order.machine)
    : order.machine;

  const description = currentLang === "zh"
    ? (order.description_zh || order.description)
    : order.description;

  return `
    <div class="record-card ${typeClass} ${extraClass}">
      <div class="record-top">
        <div>
          <p class="record-title">${title}</p>
          <p class="record-sub">${machine} • ${order.assignedTo}${order.area ? " • " + order.area : ""}</p>
        </div>
        <div class="badges">
          <span class="badge tipo">${type}</span>
          <span class="badge estado">${statusLabel}</span>
          <span class="badge prioridad">${priority}</span>
          ${late ? `<span class="badge atrasado">⚠</span>` : ""}
        </div>
      </div>

      <div class="record-info">
        <span><b>${t("date") || "Fecha"}:</b> ${order.date} ${order.time}</span>
        <span><b>${t("creator") || "Creador"}:</b> ${order.creadorNombre || order.creadoPor || "N/D"}</span>
        <span><b>${t("description") || "Descripción"}:</b> ${description || "-"}</span>
      </div>

      <div class="record-actions">
        <button class="btn-light order-view" data-id="${order.id}">${t("view") || "Ver"}</button>
        ${actions}
      </div>
    </div>
  `;
}

function buildOrderActions(order) {
  if (!currentUser) return "";

  let buttons = "";

   // Textos traducibles
  const txt = {
    inProgress: currentLang === "zh" ? "进行中" : "En proceso",
    paused: currentLang === "zh" ? "暂停" : "Pausar",
    pending: currentLang === "zh" ? "待处理" : "Pendiente",
    done: currentLang === "zh" ? "完成" : "Finalizar",
    delete: currentLang === "zh" ? "删除" : "Eliminar",
    view: currentLang === "zh" ? "查看" : "Ver detalle",
  };

  if (currentUser.role === "admin") {
    if (order.status !== "En proceso") {
      buttons += `<button class="btn-secondary order-status" data-action="inProgress" data-id="${order.id}" data-status="En proceso">${txt.inProgress}</button>`;
    }
    if (order.status !== "Pausado") {
      buttons += `<button class="btn-warning order-status" data-action="paused" data-id="${order.id}" data-status="Pausado">${txt.paused}</button>`;
    }
    if (order.status !== "Pendiente") {
      buttons += `<button class="btn-light order-status" data-action="pending" data-id="${order.id}" data-status="Pendiente">${txt.pending}</button>`;
    }
    if (order.status !== "Finalizado") {
      buttons += `<button class="btn-success order-status" data-action="done" data-id="${order.id}" data-status="Finalizado">${txt.done}</button>`;
    }

    buttons += `<button class="btn-danger order-delete" data-action="delete" data-id="${order.id}">${txt.delete}</button>`;
  }

  if (currentUser.role === "tecnico") {
    if (canEditOrder(order)) {
      buttons += `<button class="btn-secondary order-status" data-action="inProgress" data-id="${order.id}" data-status="En proceso">${txt.inProgress}</button>`;
    } else {
      buttons += `<span class="badge">${t("taken") || "Ocupada"}</span>`;
    }
  }

  return buttons;
}

function renderOrdersList() {
  // Filtrado
  let visibleOrders = getVisibleOrdersForUser();

  const statusFilter = filterStatus.value;
  const typeFilter = filterType.value;

  if (statusFilter !== "Todos") {
    visibleOrders = visibleOrders.filter(o => o.status === statusFilter);
  }

  if (typeFilter !== "Todos") {
    visibleOrders = visibleOrders.filter(o => o.type === typeFilter);
  }

  // No hay órdenes
  if (!visibleOrders.length) {
    ordersList.innerHTML = `<div class="record-card">No hay órdenes con esos filtros.</div>`;
    return;
  }

  // Render de órdenes
  ordersList.innerHTML = visibleOrders.map(orderCardHTML).join("");

  // Adjuntar eventos a botones
  document.querySelectorAll(".order-view").forEach(btn => {
    btn.onclick = () => openOrderModal(btn.dataset.id);
  });

  document.querySelectorAll(".order-status").forEach(btn => {
    btn.onclick = () => changeOrderStatus(btn.dataset.id, btn.dataset.status);
  });

  document.querySelectorAll(".order-delete").forEach(btn => {
    btn.onclick = () => deleteOrder(btn.dataset.id);
  });

  // Re-etiquetar botones según idioma
  relabelOrderButtons();
}

// =========================
// ORDER CARD
// =========================
function orderCardHTML(order) {
  const late = isLate(order);
  const typeClass = order.type.toLowerCase();
  const extraClass = late ? "atrasado" : "";

  const actions = buildOrderActions(order);

  const type = currentLang === "zh"
    ? (order.type_zh || forceTypeLabel(order.type))
    : order.type;

  const priority = currentLang === "zh"
    ? (order.priority_zh || forcePriorityLabel(order.priority))
    : order.priority;

  const statusLabel = forceStatusLabel(order.status);

  const title = currentLang === "zh"
    ? (order.title_zh || order.title)
    : order.title;

  const machine = currentLang === "zh"
    ? (order.machine_zh || order.machine)
    : order.machine;

  return `
    <div class="record-card ${typeClass} ${extraClass}">
      <div class="record-top">
        <div>
          <p class="record-title">${title}</p>
          <p class="record-sub">${machine} • ${order.assignedTo}</p>
        </div>
        <div class="badges">
          <span class="badge tipo">${type}</span>
          <span class="badge estado">${statusLabel}</span>
          <span class="badge prioridad">${priority}</span>
          ${late ? `<span class="badge atrasado">${currentLang === "zh" ? "逾期" : "Atrasado"}</span>` : ""}
        </div>
      </div>

      <div class="record-info">
  <span><b>${t("date")}:</b> ${order.date} ${order.time}</span>
  <span><b>${t("creator")}:</b> ${order.creadorNombre || order.creadoPor || "N/D"}</span>
  <span><b>${t("description")}:</b> ${currentLang === "zh" ? order.description_zh || order.description : order.description}</span>
</div>

      <div class="record-actions">
        <button class="btn-light order-view" data-id="${order.id}">Ver detalle</button>
        ${actions}
      </div>
    </div>
  `;
}

function buildOrderActions(order) {
  if (!currentUser) return "";

  let buttons = "";

  const labels = {
    inProgress: currentLang === "zh" ? "进行中" : "En proceso",
    paused: currentLang === "zh" ? "暂停" : "Pausar",
    pending: currentLang === "zh" ? "待处理" : "Pendiente",
    done: currentLang === "zh" ? "完成" : "Finalizar",
    delete: currentLang === "zh" ? "删除" : "Eliminar"
  };

  // Solo Admin controla estados / elimina
  if (currentUser.role === "admin") {
    if (order.status !== "En proceso") {
      buttons += `<button class="btn-secondary order-status" data-action="inProgress" data-id="${order.id}" data-status="En proceso">${labels.inProgress}</button>`;
    }
    if (order.status !== "Pausado") {
      buttons += `<button class="btn-warning order-status" data-action="paused" data-id="${order.id}" data-status="Pausado">${labels.paused}</button>`;
    }
    if (order.status !== "Pendiente") {
      buttons += `<button class="btn-light order-status" data-action="pending" data-id="${order.id}" data-status="Pendiente">${labels.pending}</button>`;
    }
    if (order.status !== "Finalizado") {
      buttons += `<button class="btn-success order-status" data-action="done" data-id="${order.id}" data-status="Finalizado">${labels.done}</button>`;
    }

    buttons += `<button class="btn-danger order-delete" data-action="delete" data-id="${order.id}">${labels.delete}</button>`;
  }

  // Técnico
  if (currentUser.role === "tecnico") {
    if (canEditOrder(order)) {
      if (order.status !== "Pendiente") {
        buttons += `<button class="btn-light order-status" data-action="pending" data-id="${order.id}" data-status="Pendiente">${labels.pending}</button>`;
      }
      if (order.status !== "En proceso") {
        buttons += `<button class="btn-secondary order-status" data-action="inProgress" data-id="${order.id}" data-status="En proceso">${labels.inProgress}</button>`;
      }
      if (order.status !== "Pausado") {
        buttons += `<button class="btn-warning order-status" data-action="paused" data-id="${order.id}" data-status="Pausado">${labels.paused}</button>`;
      }
      if (order.status !== "Finalizado") {
        buttons += `<button class="btn-success order-status" data-action="done" data-id="${order.id}" data-status="Finalizado">${labels.done}</button>`;
      }
    } else {
      buttons += `<span class="badge">${t("taken")}</span>`;
    }
  }

  return buttons;
}

function attachOrderButtons() {
  document.querySelectorAll(".order-view").forEach(btn => {
    btn.onclick = () => openOrderModal(btn.dataset.id);
  });

  document.querySelectorAll(".order-status").forEach(btn => {
    btn.onclick = () => changeOrderStatus(btn.dataset.id, btn.dataset.status);
  });

  document.querySelectorAll(".order-delete").forEach(btn => {
    btn.onclick = () => deleteOrder(btn.dataset.id);
  });
}

// Forzar etiquetas de botones según idioma actual
function relabelOrderButtons() {
  const labels = {
    view: currentLang === "zh" ? "查看" : "Ver detalle",
    inProgress: currentLang === "zh" ? "进行中" : "En proceso",
    paused: currentLang === "zh" ? "暂停" : "Pausar",
    pending: currentLang === "zh" ? "待处理" : "Pendiente",
    done: currentLang === "zh" ? "完成" : "Finalizar",
    delete: currentLang === "zh" ? "删除" : "Eliminar"
  };

  document.querySelectorAll(".order-view").forEach(btn => {
    btn.textContent = labels.view;
  });
  document.querySelectorAll(".order-status").forEach(btn => {
    const act = btn.dataset.action;
    if (labels[act]) btn.textContent = labels[act];
  });
  document.querySelectorAll(".order-delete").forEach(btn => {
    btn.textContent = labels.delete;
  });
}

// =========================
// ORDER ACTIONS
// =========================
async function changeOrderStatus(orderId, newStatus) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  if (!canEditOrder(order)) {
    showToast("No tienes permiso para modificar esta orden", "warning");
    return;
  }

  try {
    const ref = window.db.collection("orders").doc(orderId);

    let assignedTo = order.assignedTo;

    // 🔥 SI ES TÉCNICO Y LA ORDEN NO TIENE DUEÑO → LA TOMA
    if (currentUser.role === "tecnico") {
      const generic = !assignedTo || assignedTo === "Técnico de Mantenimiento";
      const isMine = assignedTo === currentUser.name;
      if (!generic && !isMine) {
        showToast("Otro técnico ya tiene esta orden", "warning");
        return;
      }
      if (generic) {
        assignedTo = currentUser.name;
      }
    }

    await ref.update({
      status: newStatus,
      assignedTo: assignedTo,
      history: firebase.firestore.FieldValue.arrayUnion(
        `Estado cambiado a ${newStatus} por ${currentUser.name} - ${nowString()}`
      )
    });
    showToast(`Estado actualizado a ${newStatus} 🔥`, "success");

  } catch (err) {
    console.error(err);
    showToast("Error actualizando en Firebase", "error");
  }
}

async function deleteOrder(orderId) {
  if (!currentUser || currentUser.role !== "admin") {
    showToast("No tienes permiso para eliminar", "warning");
    return;
  }

  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  if (!confirm(`¿Eliminar la orden "${order.title}"?`)) return;

  try {
    await window.db.collection("orders").doc(orderId).delete();

    showToast("Orden eliminada 🔥", "success");

  } catch (err) {
    console.error(err);
    showToast("Error eliminando en Firebase", "error");
  }
}

function canEditOrder(order) {
  if (!currentUser) return false;

  if (currentUser.role === "admin") return true;

  // Coordinador solo crea, no edita
  if (currentUser.role === "coordinador") return false;

  // Técnico solo si la orden está libre o ya le pertenece
  if (currentUser.role === "tecnico") {
    const assigned = order.assignedTo || "";
    const generic = assigned === "" || assigned === "Técnico de Mantenimiento";
    const isMine = assigned === currentUser.name;
    return generic || isMine;
  }

  return false;
}

// =========================
// MODAL
// =========================
function openOrderModal(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  currentModalOrderId = orderId;

  modalBody.innerHTML = `
  <div class="detail-grid">
    <div class="detail-card">
      <strong>${t("title")}</strong>
      <span>${currentLang === "zh" ? order.title_zh || order.title : order.title}</span>    
    </div>
    <div class="detail-card">
      <strong>${t("machine")}</strong>
      <span>${currentLang === "zh" ? order.machine_zh || order.machine : order.machine}</span>
    </div>
    <div class="detail-card">
      <strong>${t("assignedTo")}</strong>
      <span>${currentLang === "zh" ? order.assignedTo_zh || order.assignedTo : order.assignedTo}</span>
    </div>
    <div class="detail-card">
      <strong>${t("date")}</strong>
      <span>${currentLang === "zh" ? order.date_zh || order.date : order.date} ${currentLang === "zh" ? order.time_zh || order.time : order.time}</span>
    </div>
    <div class="detail-card">
      <strong>${t("type")}</strong>
      <span>${currentLang === "zh" ? order.type_zh || order.type : order.type}</span>
    </div>
    <div class="detail-card">
      <strong>${t("status")}</strong>
      <span>${currentLang === "zh" ? order.status_zh || order.status : order.status}</span>
    </div>
    <div class="detail-card">
      <strong>${t("createdBy")}</strong>
      <span>${currentLang === "zh" ? order.creadorNombre_zh || order.creadoPor_zh || "N/D" : order.creadorNombre || order.creadoPor || "N/D"}</span>
    </div>
    <div class="detail-card full">
      <strong>${t("description")}</strong>
      <span>${currentLang === "zh" ? order.description_zh || order.description : order.description}</span>
    </div>
  </div>

  <div class="modal-section">
    <h3>${t("quickActions")}</h3>
    <div class="quick-actions">
      ${buildModalActions(order)}
    </div>
  </div>

  <div class="modal-section">
    <h3>${t("history")}</h3>
    <div class="history-box">
      ${(order.history || []).map(h => `<div class="history-item">${h}</div>`).join("") || `<div class="history-item">${t("noDescription")}</div>`}
    </div>
  </div>

  <div class="modal-section">
    <h3>${t("notes")}</h3>
    <div class="history-box">
      ${(order.notes || []).map(n => `<div class="history-item">${formatNote(n)}</div>`).join("") || `<div class="history-item">${t("noDescription")}</div>`}
    </div>

    ${canEditOrder(order) ? `
      <div class="note-row">
        <input type="text" id="newNoteInput" placeholder="${t("addNote")}..." />
        <button id="addNoteBtn" class="btn btn-primary">${t("addNote")}</button>
      </div>
    ` : ""}
  </div>
`;
  orderModal.classList.add("show");

  document.querySelectorAll(".modal-status-btn").forEach(btn => {
    btn.onclick = () => changeOrderStatus(orderId, btn.dataset.status);
  });

  const addNoteBtn = document.getElementById("addNoteBtn");
  if (addNoteBtn) {
    addNoteBtn.onclick = () => addNote(orderId);
  }
}

function buildModalActions(order) {
  if (!canEditOrder(order)) return `<button class="btn btn-light">Solo lectura</button>`;

  let html = "";

  const labelForStatus = (status) => {
    if (currentLang === "zh") {
      if (status === "Pendiente") return t("pending") || "待处理";
      if (status === "En proceso") return t("inProgress") || "进行中";
      if (status === "Pausado") return t("paused") || "暂停";
      if (status === "Finalizado") return t("done") || "完成";
    }
    // español por defecto
    if (status === "Pendiente") return "Pendiente";
    if (status === "En proceso") return "En proceso";
    if (status === "Pausado") return "Pausado";
    if (status === "Finalizado") return "Finalizado";
    return status;
  };

  ["Pendiente", "En proceso", "Pausado", "Finalizado"].forEach(status => {
    if (order.status !== status) {
      let btnClass = "btn-light";
      if (status === "En proceso") btnClass = "btn-secondary";
      if (status === "Pausado") btnClass = "btn-warning";
      if (status === "Finalizado") btnClass = "btn-success";

      html += `<button class="btn ${btnClass} modal-status-btn" data-status="${status}">${labelForStatus(status)}</button>`;
    }
  });

  return html;
}

async function addNote(orderId) {
  const input = document.getElementById("newNoteInput");
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  try {
    const orderRef = window.db.collection("orders").doc(orderId);

    // Traduce la nota si estamos en chino
    let noteText = `${text} — ${currentUser.name} (${nowString()})`;
    if (currentLang === "zh") {
      const zh = await autoTranslate(text);
      noteText = `${zh} — ${currentUser.name} (${nowString()})`;
    }

    await orderRef.update({
      notes: window.firebase.firestore.FieldValue.arrayUnion(noteText),
      history: window.firebase.firestore.FieldValue.arrayUnion(
        `Nota agregada por ${currentUser.name} - ${nowString()}`
      )
    });

    showToast("Nota guardada en Firebase 🔥", "success");

  } catch (error) {
    console.error("Error agregando nota:", error);
    showToast("Error guardando nota", "error");
  }
}

function closeModal() {
  orderModal.classList.remove("show");
  currentModalOrderId = null;
}

// =========================
// NOTIFICATIONS
// =========================
function createAssignmentNotification(order) {
  notifications.unshift({
    id: generateId(),
    type: "assignment",
    title: "Nueva orden asignada",
    message: `${order.title} fue asignada a ${order.assignedTo}`,
    assignedTo: order.assignedTo,
    orderId: order.id,
    createdAt: nowString(),
    readBy: []
  });

  saveNotifications();
}

function getNotificationsForCurrentUser() {
  if (!currentUser) return [];

  if (currentUser.role === "admin" || currentUser.role === "coordinador") {
    return notifications;
  }

  return notifications.filter(n =>
    n.assignedTo === currentUser.name || n.assignedTo === "Técnico de Mantenimiento"
  );
}

function renderNotifications() {
  if (!notificationsList) return;

  const userNotifications = getNotificationsForCurrentUser();
  const unread = userNotifications.filter(n => !(n.readBy || []).includes(currentUser?.username));

  // 🔥 PROTECCIÓN
  if (notifBadge) {
    notifBadge.textContent = unread.length;
    notifBadge.classList.toggle("hidden", unread.length === 0);
  }

  if (topNotifBadge) {
    topNotifBadge.textContent = unread.length;
    topNotifBadge.classList.toggle("hidden", unread.length === 0);
  }

  notificationsList.innerHTML = userNotifications.map(n => {
    const isUnread = !(n.readBy || []).includes(currentUser.username);

    return `
      <div class="notification-item ${isUnread ? "unread" : ""}">
        <h4>${n.title}</h4>
        <p>${n.message}</p>
        <small>${n.createdAt}</small>
      </div>
    `;
  }).join("");
}

function markNotificationsViewedByCurrentUser() {
  const userNotifications = getNotificationsForCurrentUser();

  userNotifications.forEach(n => {
    if (!n.readBy) n.readBy = [];
    if (!n.readBy.includes(currentUser.username)) {
      n.readBy.push(currentUser.username);
    }
  });

  saveNotifications();
  renderNotifications();
}

function markAllNotificationsRead() {
  if (!currentUser) return;

  const userNotifications = getNotificationsForCurrentUser();

  userNotifications.forEach(n => {
    if (!n.readBy) n.readBy = [];
    if (!n.readBy.includes(currentUser.username)) {
      n.readBy.push(currentUser.username);
    }
  });

  saveNotifications();
  renderNotifications();
  showToast("Notificaciones marcadas como leídas", "success");
}

function askNotificationPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function maybePushBrowserNotification(order) {
  if (!currentUser) return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  if (order.assignedTo === "Técnico de Mantenimiento") {
    new Notification("Nueva tarea asignada", {
      body: `${order.title} • ${currentLang === "zh" ? order.machine_zh || order.machine : order.machine}`
    });
  }
}
// =========================
// CALENDAR (REAL)
// =========================
function initCalendar() {
  const calendarEl = document.getElementById("calendar");
  if (!calendarEl || calendar) return;

  calendar = new FullCalendar.Calendar(calendarEl, {

    locale: currentLang === "zh" ? "zh-cn" : "es",

    initialView: "dayGridMonth",

    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay"
    },

    buttonText: currentLang === "zh" ? {
      today: "今天",
      month: "月",
      week: "周",
      day: "日"
    } : {
      today: "Hoy",
      month: "Mes",
      week: "Semana",
      day: "Día"
    },

    height: "auto",
    navLinks: false,
    editable: false,
    selectable: false,

    eventClick: function (info) {
      const orderId = info.event.extendedProps.orderId;
      openOrderModal(orderId);
    },

    events: []
  });

  calendar.render();
  refreshCalendar();

  // Listener de resize solo ajusta tamaño, no cambia la vista
  window.addEventListener("resize", () => {
    if (!calendar) return;
    calendar.updateSize();
  });
}

function refreshCalendar() {
  if (!calendar || !currentUser) return;

  calendar.removeAllEvents();

  const visibleOrders = getVisibleOrdersForUser();

  visibleOrders.forEach(order => {
    let color = "#3b82f6";

    if (order.type === "Preventivo") color = "#16a34a";
    if (order.type === "Correctivo") color = "#2563eb";
    if (order.type === "Emergencia") color = "#dc2626";
    if (isLate(order)) color = "#d97706";

    calendar.addEvent({
      title: currentLang === "zh"
        ? (order.title_zh || order.title)
        : order.title,

      start: `${order.date}T${order.time}`,
      allDay: false,

      backgroundColor: color,
      borderColor: color,

      extendedProps: {
        orderId: order.id,

        // 🔥 TAMBIÉN PASAMOS DATOS TRADUCIDOS
        machine: currentLang === "zh"
          ? (order.machine_zh || order.machine)
          : order.machine
      }
    });
  });
}

// =========================
// SERVER IP
// =========================
async function fetchServerIp() {
  try {
    const res = await fetch("/api/server-info");
    const data = await res.json();

    if (data.ok) {
      serverIp.textContent = data.url;
    } else {
      serverIp.textContent = "No disponible";
    }

  } catch (err) {
    serverIp.textContent = "No disponible";
  }
}

async function copyIpToClipboard() {
  try {
    await navigator.clipboard.writeText(serverIp.textContent);
    showToast("IP copiada", "success");
  } catch {
    showToast("No se pudo copiar", "warning");
  }
}
const uiCache = {};

async function translateUI() {
  if (currentLang !== "zh") return;

  const elements = document.querySelectorAll("h1, h2, h3, p, span, button, label, strong");

  for (const el of elements) {

    if (!el) continue;

    // ❌ NO tocar elementos con data-i18n (los controlas con t())
    if (el.hasAttribute("data-i18n")) continue;

    // ❌ evitar inputs
    if (["INPUT", "TEXTAREA"].includes(el.tagName)) continue;

    let text = el.innerText;
    if (!text) continue;

    text = text.trim();

    // ❌ ignorar vacío o corto
    if (text.length < 2) continue;

    // ❌ SI YA TIENE CHINO → NO TOCAR
    if (/[\u4e00-\u9fff]/.test(text)) continue;

    // ❌ ignorar cosas como números
    if (!isNaN(text)) continue;

    // 🔥 cache
    if (uiCache[text]) {
      el.innerText = uiCache[text];
      continue;
    }

    try {
      const translated = await autoTranslate(text);

      uiCache[text] = translated;
      el.innerText = translated;

    } catch (err) {
      console.error(err);
    }
  }
}

// =========================
// TOAST
// =========================
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");

  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// =========================
// MACHINES FIREBASE REALTIME
// =========================
let machinesFirebase = [];

function listenMachinesRealtime() {
  if (!window.db) return;

  window.db.collection("machines").onSnapshot(snapshot => {
    machinesFirebase = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    machinesFirebase.forEach(m => ensureMachineTranslation(m));
    // Si el usuario ya está en chino, asegura traducción y render inmediata
    if (currentLang === "zh") {
      translateAllDataIfNeeded();
    }
    console.log("MAQUINAS FIREBASE:", machinesFirebase);

    renderMachines();
    fillSelects();
    renderStats();
  }, (err) => {
    console.error("Error escuchando machines:", err);
    showToast("No se pueden leer máquinas (permisos)", "warning");
  });
}

function renderMachines() {
  const container = document.getElementById("areasGrid");
  if (!container) return;

  if (!machinesFirebase.length) {
    container.innerHTML = `<div class="record-card">${t("noMachines") || "No hay máquinas."}</div>`;
    return;
  }

  // Agrupa por área
  const groups = {};
  machinesFirebase.forEach(m => {
    const area = m.area || "Sin área";
    if (!groups[area]) groups[area] = [];
    groups[area].push(m);
  });

  container.innerHTML = Object.entries(groups).map(([area, list]) => {
    const countLabel = `${t("registeredMachines") || "Máquinas registradas"}: ${list.length}`;
    const cards = list.map(m => {
      const name = currentLang === "zh" ? (m.name_zh || m.name) : m.name;
      const status = translateMachineStatus(m.status);
      const model = m.model || "****";
      return `
        <div class="area-machine-card">
          <p class="record-title">${name}</p>
          <p class="record-sub">${m.area || ""}</p>
          <p><b>${t("model") || "Modelo"}:</b> ${model}</p>
          <p><b>${t("status") || "Estado"}:</b> ${status}</p>
        </div>
      `;
    }).join("");

    return `
      <div class="area-column">
        <div class="area-header">
          <span>📦</span>
          <div>
            <div>${area}</div>
            <small>${countLabel}</small>
          </div>
        </div>
        <div class="area-machines">
          ${cards}
        </div>
      </div>
    `;
  }).join("");
}

// =========================
// CREATE MACHINE
// =========================
async function handleCreateMachine(e) {
  e.preventDefault();

  console.log("CREANDO MAQUINA...");

  try {
    if (!currentUser || currentUser.role !== "admin") {
      showToast("Solo el admin puede crear máquinas", "warning");
      return;
    }

    if (!window.db) {
      console.error("Firebase NO está disponible");
      showToast("Firebase no conectado", "error");
      return;
    }

    const name = document.getElementById("machineName").value.trim();
    const area = document.getElementById("machineArea").value.trim();
    const model = document.getElementById("machineModel").value.trim();
    const status = document.getElementById("machineStatus").value;

    if (!name || !area) {
      showToast("Nombre y área son obligatorios", "warning");
      return;
    }

    // 🔥 TRADUCIR ANTES DE GUARDAR
    let name_zh = name;

    try {
      if (typeof autoTranslate === "function") {
        name_zh = await autoTranslate(name);
      }
    } catch (err) {
      console.warn("No se pudo traducir máquina:", err);
    }

    const machineData = {
      name,
      name_zh, // 🔥 CLAVE
      area,
      model,
      status,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.uid || currentUser.username,
      creatorName: currentUser.name
    };

    console.log("ENVIANDO A FIREBASE:", machineData);

    const docRef = await window.db.collection("machines").add(machineData);

    console.log("GUARDADO OK ID:", docRef.id);

    showToast("Máquina creada 🔥", "success");

    e.target.reset();

    document.getElementById("machineModal").classList.remove("show");

  } catch (error) {
    console.error("ERROR REAL:", error);
    showToast("Error guardando en Firebase", "error");
  }
}
