// =========================
// CMMS VALLE - APP.JS FULL
// =========================
async function autoTranslate(text, target = "zh") {
  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text, target })
    });

    const data = await res.json();
    return data.translated || text;

  } catch (err) {
    console.error("Error traduciendo:", err);
    return text;
  }
}
const LANG = {
  es: {
    title: "Corporación del Valle Metropolitano",
    subtitle: "CMMS • Acceso",
    user: "Usuario",
    pass: "Contraseña",
    placeholderUser: "Correo electrónico",
    placeholderPass: "Contraseña",
    login: "Ingresar",

    assignedTo: "Asignado a",
    type: "Tipo",
    model: "Modelo",
    status: "Estado",
    view: "Ver detalle",
    pause: "Pausar",
    finish: "Finalizar",

    dashboard: "Dashboard",
    orders: "Órdenes",
    machines: "Máquinas",
    notifications: "Notificaciones",

    recentOrders: "Órdenes recientes",
    quickAlerts: "Alertas rápidas",
    late: "Atrasada",
    taken: "Tomada por otro técnico",

    noDescription: "Sin descripción",
    noAlerts: "Sin alertas críticas",
    createdBy: "Creada por",
    addNote: "Agregar nota",

    createOrder: "Crear orden",
    delete: "Eliminar",
    edit: "Editar",
    view: "Ver",

    pending: "Pendiente",
    inProgress: "En proceso",
    paused: "Pausado",
    done: "Finalizado",

    calendar: "Calendario",
    date: "Fecha",
    creator: "Creador",
    description: "Descripción",

    noOrders: "No hay órdenes",
    noOrdersFilter: "No hay órdenes con esos filtros",
    noMachines: "No hay máquinas",

    assigned: "Asignado a",
    history: "Historial",
    notes: "Notas",
    quickActions: "Acciones rápidas"

  },

  zh: {
    title: "大都会谷公司",
    subtitle: "CMMS • 登录",
    user: "用户",
    pass: "密码",
    placeholderUser: "电子邮件",
    placeholderPass: "密码",
    login: "登录",

    assignedTo: "分配给",
    type: "类型",
    model: "型号",
    status: "状态",
    view: "查看",
    pause: "暂停",
    finish: "完成",


    dashboard: "仪表板",
    orders: "工单",
    machines: "机器",
    notifications: "通知",

    recentOrders: "最近工单",
    quickAlerts: "快速警报",
    late: "延误",
    taken: "已被其他技术员接管",

    noDescription: "无描述",
    noAlerts: "没有警报",
    createdBy: "创建者",
    addNote: "添加",

    createOrder: "创建工单",
    delete: "删除",
    edit: "编辑",
    view: "查看",

    pending: "待处理",
    inProgress: "进行中",
    paused: "已暂停",
    done: "已完成",

    calendar: "日历",
    date: "日期",
    creator: "创建者",
    description: "描述",

    noOrders: "没有工单",
    noOrdersFilter: "没有符合条件的工单",
    noMachines: "没有机器",

    assigned: "分配给",
    history: "历史",
    notes: "备注",
    quickActions: "快速操作"
  }
};
let currentLang = localStorage.getItem("lang") || "es";
console.log("APP CARGANDO...");

function t(key) {
  return LANG[currentLang][key] || key;
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

const logoutBtn = document.getElementById("logoutBtn");
const copyIpBtn = document.getElementById("copyIpBtn");
const serverIp = document.getElementById("serverIp");

const orderForm = document.getElementById("orderForm");
const orderMachine = document.getElementById("orderMachine");
const orderAssigned = document.getElementById("orderAssigned");

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
document.addEventListener("DOMContentLoaded", () => {

  console.log("APP CARGANDO...");

  function applyTranslations() {
    const langData = LANG[currentLang];

    // 🔹 Traducciones por data-i18n (TODO el sistema)
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.dataset.i18n;
      if (langData[key]) {
        el.textContent = langData[key];
      }
    });

    // 🔹 LOGIN (placeholders especiales)
    const loginUser = document.getElementById("loginUser");
    const loginPass = document.getElementById("loginPass");

    if (loginUser) loginUser.placeholder = langData.placeholderUser;
    if (loginPass) loginPass.placeholder = langData.placeholderPass;
  }

  // ===== BOTÓN IDIOMA =====
  const langToggle = document.getElementById("langToggle");

  if (langToggle) {
    langToggle.textContent = currentLang === "es" ? "ES" : "中文";

    langToggle.addEventListener("click", () => {

      currentLang = currentLang === "es" ? "zh" : "es";
      localStorage.setItem("lang", currentLang);

      langToggle.textContent = currentLang === "es" ? "ES" : "中文";

      // 🔥 limpiar cache
      Object.keys(uiCache).forEach(k => delete uiCache[k]);

      // 🔥 aplicar traducciones
      applyTranslations();

      // 🔥 renderizar UI
      if (typeof renderAll === "function") {
        renderAll();
      }

      // 🔥 IA solo para chino
      if (currentLang === "zh") {
        setTimeout(() => translateUI(), 300);
      }
    });
  }

  // ===== ELEMENTOS =====
  const btnNewMachine = document.getElementById("btnNewMachine");
  const machineModal = document.getElementById("machineModal");
  const closeMachineModal = document.getElementById("closeMachineModal");
  const machineForm = document.getElementById("machineForm");

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
      if (e.target === machineModal) {
        machineModal.classList.remove("show");
      }
    });
  }

  if (machineForm) {
    machineForm.addEventListener("submit", handleCreateMachine);
  }

  // ===== EVENTOS =====
  if (typeof bindEvents === "function") {
    bindEvents();
  }

  // ===== FIREBASE =====
  if (USE_FIREBASE_AUTH && window.firebase && firebase.auth) {
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.NONE);

    firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {
        await loadUserProfile(user);

        loginScreen.classList.add("hidden");
        appRoot.classList.remove("hidden");

        applyUserUI();
        initCalendar();
        listenMachinesRealtime();
        fillSelects();
        listenOrdersRealtime();
        renderAll();
        refreshCalendar();

      } else {
        currentUser = null;
        loginScreen.classList.remove("hidden");
        appRoot.classList.add("hidden");
      }
    });
  }

}); // ✅ SOLO UNO


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

// =========================
// SELECTS
// =========================
async function fillSelects() {
  try {
    if (!orderMachine || !orderAssigned) {
      console.warn("No existen los selects de orden");
      return;
    }

    // Si Firebase no está listo, usa fallback local
    if (!window.db) {
      console.warn("Firebase no inicializado; usando datos locales");
      orderMachine.innerHTML = `<option value="">Seleccione una máquina</option>` +
        MACHINES.map(m => `<option value="${m.name}">${m.name}</option>`).join("");
      const assignOptionsLocal = ["Técnico de Mantenimiento", ...TECHNICIANS];
      orderAssigned.innerHTML = `<option value="">Seleccione un técnico</option>` +
        assignOptionsLocal.map(t => `<option value="${t}">${t}</option>`).join("");
      return;
    }

    // Placeholders
    orderMachine.innerHTML = `<option value="">Seleccione una máquina</option>`;
    orderAssigned.innerHTML = `<option value="">Seleccione un técnico</option>`;

    // ===== MÁQUINAS DESDE FIREBASE =====
    let machinesSnap;
    try {
      machinesSnap = await window.db.collection("machines").get();
    } catch (err) {
      console.error("Error leyendo machines en Firestore:", err);
      machinesSnap = { empty: true, forEach: () => { } };
    }

    if (!machinesSnap.empty) {
      machinesSnap.forEach(doc => {
        const machine = doc.data();
        const machineName =
          machine.name ||
          machine.nombre ||
          machine.title ||
          `Máquina ${doc.id}`;

        orderMachine.innerHTML += `<option value="${machineName}">${machineName}</option>`;
      });
    } else {
      // Si no hay máquinas en Firebase
      if (machinesSnap.empty) {
        orderMachine.innerHTML += `<option value="">No hay máquinas registradas</option>`;
      }
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

    // Si no encontró técnicos en Firebase, usa demo
    if (techsFound === 0) {
      const assignOptions = ["Técnico de Mantenimiento", ...TECHNICIANS];
      orderAssigned.innerHTML += assignOptions.map(
        t => `<option value="${t}">${t}</option>`
      ).join("");
    }

    console.log("Selects cargados correctamente");
  } catch (err) {
    console.error("Error cargando selects (bloque externo):", err);

    // fallback total
    orderMachine.innerHTML = `<option value="">Seleccione una máquina</option>` +
      MACHINES.map(m => `<option value="${m.name}">${m.name}</option>`).join("");

    const assignOptions = ["Técnico de Mantenimiento", ...TECHNICIANS];
    orderAssigned.innerHTML = `<option value="">Seleccione un técnico</option>` +
      assignOptions.map(t => `<option value="${t}">${t}</option>`).join("");

    showToast("No se pudieron cargar máquinas/técnicos desde Firebase", "warning");
  }
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

  const title = document.getElementById("orderTitle").value.trim();
  const description = document.getElementById("orderDescription").value.trim();
  const machine = document.getElementById("orderMachine").value;

  // 🔥 TRADUCCIÓN AUTOMÁTICA
  const title_zh = await autoTranslate(title);
  const description_zh = await autoTranslate(description);
  const machine_zh = await autoTranslate(machine);

  const newOrder = {
    title,
    title_zh,
    description,
    description_zh,
    machine,
    machine_zh,
    assignedTo: document.getElementById("orderAssigned").value,
    type: document.getElementById("orderType").value,
    priority: document.getElementById("orderPriority").value,
    date: document.getElementById("orderDate").value,
    time: document.getElementById("orderTime").value
  };

  try {
    await window.db.collection("orders").add({
      ...newOrder,
      status: "Pendiente",
      createdAt: new Date().toISOString(),
      creadoPor: currentUser.uid || currentUser.username,
      creadorNombre: currentUser.name,
      history: [`Orden creada - ${nowString()}`],
      notes: []
    });

    // Notificación interna
    createAssignmentNotification({
      ...newOrder,
      id: "temp-" + Date.now()
    });

    orderForm.reset();
    document.getElementById("orderDate").value = getTodayOffset(0);

    // Refresco manual visual (aunque el realtime debería entrar)
    setTimeout(() => {
      if (typeof renderAll === "function") renderAll();
    }, 300);

    showToast("Orden creada en Firebase 🔥", "success");

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

  // 🔥 SOLO UNA TRADUCCIÓN FINAL
  if (currentLang === "zh") {
    setTimeout(() => translateUI(), 500);
  }
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

function translateStatus(status) {
  if (status === "Pendiente") return t("pending");
  if (status === "En proceso") return t("inProgress");
  if (status === "Pausado") return t("paused");
  if (status === "Finalizado") return t("done");
  return status;
}

function renderDashboardOrders() {
  const visibleOrders = getVisibleOrdersForUser().slice(0, 8);

  if (!visibleOrders.length) {
    dashboardOrders.innerHTML = `<div class="record-card">${t("noOrders") || "No hay órdenes"}</div>`;
    return;
  }

  dashboardOrders.innerHTML = visibleOrders.map(orderCardHTML).join("");
  attachOrderButtons();
}

function renderOrdersList() {
  let visibleOrders = getVisibleOrdersForUser();

  const statusFilter = filterStatus.value;
  const typeFilter = filterType.value;

  if (statusFilter !== "Todos") {
    visibleOrders = visibleOrders.filter(o => o.status === statusFilter);
  }

  if (typeFilter !== "Todos") {
    visibleOrders = visibleOrders.filter(o => o.type === typeFilter);
  }

  if (!visibleOrders.length) {
    ordersList.innerHTML = `<div class="record-card">${t("noOrdersFilter") || "No hay órdenes con esos filtros"}</div>`;
    return;
  }

  ordersList.innerHTML = visibleOrders.map(orderCardHTML).join("");

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

function orderCardHTML(order) {
  const late = isLate(order);
  const typeClass = order.type.toLowerCase();
  const extraClass = late ? "atrasado" : "";

  const actions = buildOrderActions(order);

  return `
    <div class="record-card ${typeClass} ${extraClass}">
      <div class="record-top">
        <div>
          <p class="record-title">${order.title}</p>
          <p class="record-sub">${translateMachineName(order.machine)} • ${order.assignedTo}</p>
        </div>
        <div class="badges">
          <span class="badge tipo">${order.type}</span>
          <span class="badge estado">${translateStatus(order.status)}</span>
          <span class="badge prioridad">${order.priority}</span>
          ${late ? `<span class="badge atrasado">⚠</span>` : ""}
        </div>
      </div>

      <div class="record-info">
        <span><b>${t("date") || "Fecha"}:</b> ${order.date} ${order.time}</span>
        <span><b>${t("creator") || "Creador"}:</b> ${order.creadorNombre || order.creadoPor || "N/D"}</span>
        <span><b>${t("description") || "Descripción"}:</b> ${order.description || "-"}</span>
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

  if (currentUser.role === "admin") {
    if (order.status !== "En proceso") {
      buttons += `<button class="btn-secondary order-status" data-id="${order.id}" data-status="En proceso">${t("inProgress")}</button>`;
    }
    if (order.status !== "Pausado") {
      buttons += `<button class="btn-warning order-status" data-id="${order.id}" data-status="Pausado">${t("paused")}</button>`;
    }
    if (order.status !== "Pendiente") {
      buttons += `<button class="btn-light order-status" data-id="${order.id}" data-status="Pendiente">${t("pending")}</button>`;
    }
    if (order.status !== "Finalizado") {
      buttons += `<button class="btn-success order-status" data-id="${order.id}" data-status="Finalizado">${t("done")}</button>`;
    }

    buttons += `<button class="btn-danger order-delete" data-id="${order.id}">${t("delete")}</button>`;
  }

  if (currentUser.role === "tecnico") {
    if (canEditOrder(order)) {
      buttons += `<button class="btn-secondary order-status" data-id="${order.id}" data-status="En proceso">${t("inProgress")}</button>`;
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
}

// =========================
// ORDER CARD
// =========================
function orderCardHTML(order) {
  const late = isLate(order);
  const typeClass = order.type.toLowerCase();
  const extraClass = late ? "atrasado" : "";

  const actions = buildOrderActions(order);

  return `
    <div class="record-card ${typeClass} ${extraClass}">
      <div class="record-top">
        <div>
          <p class="record-title">${currentLang === "zh" ? order.title_zh || order.title : order.title}</p>
          <p class="record-sub">${currentLang === "zh" ? order.machine_zh || order.machine : order.machine} • ${order.assignedTo}</p>
        </div>
        <div class="badges">
          <span class="badge tipo">${order.type}</span>
          <span class="badge estado">${translateStatus(order.status)}</span>
          <span class="badge prioridad">${order.priority}</span>
          ${late ? `<span class="badge atrasado">Atrasado</span>` : ""}
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

  // Solo Admin controla estados / elimina
  if (currentUser.role === "admin") {
    if (order.status !== "En proceso") {
      buttons += `<button class="btn-secondary order-status" data-id="${order.id}" data-status="En proceso">En proceso</button>`;
    }
    if (order.status !== "Pausado") {
      buttons += `<button class="btn-warning order-status" data-id="${order.id}" data-status="Pausado">Pausar</button>`;
    }
    if (order.status !== "Pendiente") {
      buttons += `<button class="btn-light order-status" data-id="${order.id}" data-status="Pendiente">Pendiente</button>`;
    }
    if (order.status !== "Finalizado") {
      buttons += `<button class="btn-success order-status" data-id="${order.id}" data-status="Finalizado">Finalizar</button>`;
    }

    buttons += `<button class="btn-danger order-delete" data-id="${order.id}">Eliminar</button>`;
  }

  // Técnico
  if (currentUser.role === "tecnico") {
    if (canEditOrder(order)) {
      if (order.status !== "Pendiente") {
        buttons += `<button class="btn-light order-status" data-id="${order.id}" data-status="Pendiente">Pendiente</button>`;
      }
      if (order.status !== "En proceso") {
        buttons += `<button class="btn-secondary order-status" data-id="${order.id}" data-status="En proceso">En proceso</button>`;
      }
      if (order.status !== "Pausado") {
        buttons += `<button class="btn-warning order-status" data-id="${order.id}" data-status="Pausado">Pausar</button>`;
      }
      if (order.status !== "Finalizado") {
        buttons += `<button class="btn-success order-status" data-id="${order.id}" data-status="Finalizado">Finalizar</button>`;
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
      ${(order.notes || []).map(n => `<div class="history-item">${n}</div>`).join("") || `<div class="history-item">${t("noDescription")}</div>`}
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

  ["Pendiente", "En proceso", "Pausado", "Finalizado"].forEach(status => {
    if (order.status !== status) {
      let btnClass = "btn-light";
      if (status === "En proceso") btnClass = "btn-secondary";
      if (status === "Pausado") btnClass = "btn-warning";
      if (status === "Finalizado") btnClass = "btn-success";

      html += `<button class="btn ${btnClass} modal-status-btn" data-status="${status}">${status}</button>`;
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

    const noteText = `${text} — ${currentUser.name} (${nowString()})`;

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
    locale: "es",
    initialView: "dayGridMonth", // vista por defecto
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay"
    },
    buttonText: {
      today: "Hoy",
      month: "Mes",
      week: "Semana",
      day: "Día"
    },
    height: "auto",
    navLinks: false,
    editable: false,
    selectable: false,
    selectMirror: false,
    eventStartEditable: false,
    eventDurationEditable: false,

    longPressDelay: 300,
    eventLongPressDelay: 300,
    selectLongPressDelay: 300,

    dayMaxEvents: true,

    eventClick: function (info) {
      const orderId = info.event.extendedProps.orderId;

      console.log("CLICK EVENT:", orderId); // DEBUG

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
      title: `${order.title}`,
      start: `${order.date}T${order.time}`,
      allDay: false,
      backgroundColor: color,
      borderColor: color,
      extendedProps: {
        orderId: order.id
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
  const container = document.getElementById("machinesList");
  if (!container) return;

  if (!machinesFirebase.length) {
    container.innerHTML = `<div class="record-card">No hay máquinas.</div>`;
    return;
  }

  container.innerHTML = machinesFirebase.map(m => `
    <div class="record-card">
  <p class="record-title">${translateMachineName(m.name)}</p>
<p class="record-sub">${m.area}</p>
<p><b>${t("model") || "Modelo"}:</b> ${m.model || "-"}</p>
<p><b>${t("status") || "Estado"}:</b> ${translateMachineStatus(m.status)}</p>
    </div>
  `).join("");
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

    const machineData = {
      name,
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
