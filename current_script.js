
        const socket = io();

        let currentUser = null;
        let ordenes = [];
        let calendar = null;
        let ordenSeleccionada = null;
        let soundEnabled = true;

        socket.on('actualizar_mantenimientos', async () => {
            await cargarOrdenes();
        });

        socket.on('alerta_vencida', () => {
            mostrarAlerta();
            if (soundEnabled) reproducirPing();
        });

        function toggleSound() {
            soundEnabled = !soundEnabled;
            document.getElementById('soundText').textContent = soundEnabled ? 'Sonido ON' : 'Sonido OFF';
        }

        function reproducirPing() {
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'sine';
                osc.frequency.value = 880;
                gain.gain.value = 0.05;

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start();
                setTimeout(() => {
                    osc.stop();
                    ctx.close();
                }, 180);
            } catch (e) {
                console.log('No se pudo reproducir sonido');
            }
        }

        function mostrarAlerta() {
            const banner = document.getElementById('alertBanner');
            banner.style.display = 'block';
            setTimeout(() => {
                banner.style.display = 'none';
            }, 5000);
        }

        async function login() {
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            const loginError = document.getElementById('loginError');

            loginError.textContent = '';

            try {
                const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await res.json();

                if (!res.ok) {
                    loginError.textContent = data.error || 'Error al iniciar sesión';
                    return;
                }

                currentUser = data.user;
                localStorage.setItem('cmmsUser', JSON.stringify(currentUser));

                document.getElementById('loginScreen').classList.add('hidden');
                document.getElementById('appScreen').classList.remove('hidden');
                document.getElementById('userInfo').textContent =
                    `${currentUser.nombre} (${currentUser.rol})`;

                aplicarPermisos();
                initCalendar();
                await cargarOrdenes();
            } catch (error) {
                loginError.textContent = 'No se pudo conectar con el servidor';
            }
        }

        function logout() {
            localStorage.removeItem('cmmsUser');
            location.reload();
        }

        function aplicarPermisos() {
            const sidebar = document.querySelector('.sidebar');
            const puedeCrear = ['admin', 'supervisor', 'coordinador', 'tecnico'].includes(currentUser.rol);

            if (!puedeCrear) {
                sidebar.classList.add('hidden');
            } else {
                sidebar.classList.remove('hidden');
            }
        }

        function getCalendarView() {
            return window.innerWidth <= 768 ? 'listWeek' : 'dayGridMonth';
        }

        function initCalendar() {
            const calendarEl = document.getElementById('calendar');

            if (calendar) {
                calendar.destroy();
            }

            calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: getCalendarView(),
                height: 'auto',
                locale: 'es',
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: window.innerWidth <= 768 ? 'listWeek,dayGridMonth' : 'dayGridMonth,timeGridWeek,listWeek'
                },
                events: [],
                eventClick: function (info) {
                    const id = Number(info.event.id);
                    const orden = ordenes.find(o => o.id === id);
                    if (orden) abrirModal(orden);
                },
                eventDidMount: function (info) {
                    if (info.event.extendedProps.estado === 'Vencido' || info.event.extendedProps.estado === 'No completado') {
                        info.el.classList.add('vencido');
                    }
                }
            });

            calendar.render();
        }

        async function cargarOrdenes() {
            try {
                const res = await fetch('/api/mantenimientos');
                ordenes = await res.json();

                actualizarStats();
                renderCalendar();
                renderOrders();

                const hayAlertas = ordenes.some(o => o.estado === 'Vencido' || o.estado === 'No completado');
                if (hayAlertas) {
                    mostrarAlerta();
                }
            } catch (error) {
                console.error('Error cargando órdenes', error);
            }
        }

        function actualizarStats() {
            const total = ordenes.length;
            const pendientes = ordenes.filter(o =>
                ['Pendiente', 'En camino', 'En proceso', 'Pausado'].includes(o.estado)
            ).length;
            const completadas = ordenes.filter(o => o.estado === 'Completado').length;
            const vencidas = ordenes.filter(o =>
                ['Vencido', 'No completado'].includes(o.estado)
            ).length;

            document.getElementById('statTotal').textContent = total;
            document.getElementById('statPendientes').textContent = pendientes;
            document.getElementById('statCompletadas').textContent = completadas;
            document.getElementById('statVencidas').textContent = vencidas;
        }

        function estadoColor(estado) {
            const map = {
                'Pendiente': '#2563eb',
                'En camino': '#ca8a04',
                'En proceso': '#ea580c',
                'Pausado': '#64748b',
                'Completado': '#16a34a',
                'No completado': '#dc2626',
                'Vencido': '#b91c1c'
            };
            return map[estado] || '#334155';
        }

        function tipoIcono(tipo) {
            const map = {
                'Preventivo': '🛠',
                'Correctivo': '⚙',
                'Emergencia': '🚨',
                'Inspección': '🔍'
            };
            return map[tipo] || '📌';
        }

        function estadoIcono(estado) {
            const map = {
                'Pendiente': '🔵',
                'En camino': '🚚',
                'En proceso': '⏳',
                'Pausado': '⏸',
                'Completado': '✔',
                'No completado': '✖',
                'Vencido': '⚠'
            };
            return map[estado] || '📌';
        }

        function renderCalendar() {
            if (!calendar) return;

            const events = ordenes.map((o) => ({
                id: String(o.id),
                title: `${estadoIcono(o.estado)} ${tipoIcono(o.tipo)} ${o.titulo}`,
                date: o.fecha,
                backgroundColor: estadoColor(o.estado),
                borderColor: estadoColor(o.estado),
                textColor: '#ffffff',
                extendedProps: {
                    estado: o.estado
                }
            }));

            calendar.removeAllEvents();
            events.forEach(e => calendar.addEvent(e));
        }

        function renderOrders() {
            const list = document.getElementById('ordersList');
            const filtroEstado = document.getElementById('filtroEstado').value;
            const filtroPrioridad = document.getElementById('filtroPrioridad').value;
            const busqueda = document.getElementById('busqueda').value.toLowerCase().trim();

            let data = [...ordenes];

            if (filtroEstado) {
                data = data.filter(o => o.estado === filtroEstado);
            }

            if (filtroPrioridad) {
                data = data.filter(o => o.prioridad === filtroPrioridad);
            }

            if (busqueda) {
                data = data.filter(o =>
                    o.titulo.toLowerCase().includes(busqueda) ||
                    o.maquina.toLowerCase().includes(busqueda)
                );
            }

            // Filtrado por rol
            if (currentUser?.rol === 'tecnico') {
                data = data.filter(o =>
                    !o.tecnicoAsignado ||
                    o.tecnicoAsignado.toLowerCase().includes(currentUser.nombre.toLowerCase()) ||
                    o.tecnicoAsignado.toLowerCase().includes(currentUser.username.toLowerCase())
                );
            }

            if (currentUser?.rol === 'coordinador') {
                data = data.filter(o =>
                    o.reportadoPor === currentUser.nombre || o.area === currentUser.area
                );
            }

            if (!data.length) {
                list.innerHTML = '<div class="note">No hay órdenes para mostrar.</div>';
                return;
            }

            list.innerHTML = data
                .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                .map(o => `
          <div class="order-card">
            <div class="order-top">
              <div>
                <div class="order-title">${tipoIcono(o.tipo)} ${o.titulo}</div>
                <div style="font-size:12px; color:#64748b;">${o.fecha}</div>
              </div>
              <div class="badges">
                <span class="badge badge-tipo">${o.tipo}</span>
                <span class="badge badge-prioridad">${o.prioridad}</span>
                <span class="badge estado-${o.estado.replace(/ /g, '\\ ')}">${o.estado}</span>
              </div>
            </div>

            <div class="order-grid">
              <div><strong>Máquina:</strong> ${o.maquina}</div>
              <div><strong>Área:</strong> ${o.area}</div>
              <div><strong>Reportó:</strong> ${o.reportadoPor}</div>
              <div><strong>Técnico:</strong> ${o.tecnicoAsignado || 'Sin asignar'}</div>
            </div>

            <div class="order-actions">
              <button class="btn btn-secondary btn-small" onclick="abrirModalPorId(${o.id})">Ver / editar</button>
              ${currentUser?.rol === 'admin' ? `<button class="btn btn-danger btn-small" onclick="eliminarOrden(${o.id})">Eliminar</button>` : ''}
            </div>
          </div>
        `).join('');
        }

        async function crearOrden() {
            if (!currentUser) return;

            const payload = {
                tipo: document.getElementById('tipo').value,
                titulo: document.getElementById('titulo').value.trim(),
                fecha: document.getElementById('fecha').value,
                maquina: document.getElementById('maquina').value.trim(),
                area: document.getElementById('area').value.trim(),
                prioridad: document.getElementById('prioridad').value,
                tecnicoAsignado: document.getElementById('tecnicoAsignado').value.trim(),
                errorReportado: document.getElementById('errorReportado').value.trim(),
                notas: document.getElementById('notas').value.trim(),
                reportadoPor: currentUser.nombre,
                reportadoPorRol: currentUser.rol
            };

            if (!payload.titulo || !payload.fecha || !payload.maquina || !payload.area) {
                alert('Completá los campos obligatorios');
                return;
            }

            try {
                const res = await fetch('/api/mantenimientos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();

                if (!res.ok) {
                    alert(data.error || 'No se pudo crear la orden');
                    return;
                }

                limpiarFormulario();
                await cargarOrdenes();
                alert('Orden creada correctamente');
            } catch (error) {
                alert('Error al guardar la orden');
            }
        }

        function limpiarFormulario() {
            document.getElementById('titulo').value = '';
            document.getElementById('fecha').value = '';
            document.getElementById('maquina').value = '';
            document.getElementById('area').value = '';
            document.getElementById('tecnicoAsignado').value = '';
            document.getElementById('errorReportado').value = '';
            document.getElementById('notas').value = '';
        }

        function abrirModalPorId(id) {
            const orden = ordenes.find(o => o.id === id);
            if (orden) abrirModal(orden);
        }

        function abrirModal(orden) {
            ordenSeleccionada = orden;

            document.getElementById('modalBackdrop').classList.remove('hidden');
            document.getElementById('modalTitle').textContent = `${tipoIcono(orden.tipo)} ${orden.titulo}`;

            document.getElementById('modalInfo').innerHTML = `
        <div><strong>Tipo:</strong> ${orden.tipo}</div><br>
        <div><strong>Estado:</strong> ${orden.estado}</div><br>
        <div><strong>Fecha programada:</strong> ${orden.fecha}</div><br>
        <div><strong>Máquina:</strong> ${orden.maquina}</div><br>
        <div><strong>Área:</strong> ${orden.area}</div><br>
        <div><strong>Prioridad:</strong> ${orden.prioridad}</div><br>
        <div><strong>Reportado por:</strong> ${orden.reportadoPor}</div><br>
        <div><strong>Técnico:</strong> ${orden.tecnicoAsignado || 'Sin asignar'}</div><br>
        <div><strong>Error reportado:</strong> ${orden.errorReportado || 'Sin detalle'}</div><br>
        <div><strong>Notas iniciales:</strong> ${orden.notas || 'Sin notas'}</div><br>
        <div><strong>Fecha atención:</strong> ${formatearFecha(orden.fechaAtencion)}</div><br>
        <div><strong>Fecha cierre:</strong> ${formatearFecha(orden.fechaCierre)}</div>
      `;

            document.getElementById('modalEstado').value = orden.estado;
            document.getElementById('modalActividad').value = orden.actividadRealizada || '';
            document.getElementById('modalRepuestos').value = orden.repuestosUsados || '';
            document.getElementById('modalCausa').value = orden.causaRaiz || '';
            document.getElementById('modalObsSupervisor').value = orden.observacionesSupervisor || '';
            document.getElementById('modalNotaNueva').value = '';

            const historial = (orden.historial || []).slice().reverse();
            document.getElementById('modalHistorial').innerHTML = historial.length
                ? historial.map(h => `
            <div class="history-item">
              <strong>${new Date(h.fecha).toLocaleString()}</strong><br>
              ${h.accion}<br>
              <span style="color:#64748b;">Por: ${h.usuario}</span>
            </div>
          `).join('')
                : '<div class="note">Sin historial</div>';
        }

        function cerrarModal() {
            document.getElementById('modalBackdrop').classList.add('hidden');
            ordenSeleccionada = null;
        }

        async function guardarCambiosOrden() {
            if (!ordenSeleccionada || !currentUser) return;

            const payload = {
                estado: document.getElementById('modalEstado').value,
                actividadRealizada: document.getElementById('modalActividad').value.trim(),
                repuestosUsados: document.getElementById('modalRepuestos').value.trim(),
                causaRaiz: document.getElementById('modalCausa').value.trim(),
                observacionesSupervisor: document.getElementById('modalObsSupervisor').value.trim(),
                notaNueva: document.getElementById('modalNotaNueva').value.trim(),
                usuarioCambio: currentUser.nombre
            };

            try {
                const res = await fetch(`/api/mantenimientos/${ordenSeleccionada.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();

                if (!res.ok) {
                    alert(data.error || 'No se pudo actualizar');
                    return;
                }

                await cargarOrdenes();
                abrirModalPorId(ordenSeleccionada.id);

                if (payload.estado === 'No completado' || payload.estado === 'Vencido') {
                    mostrarAlerta();
                    if (soundEnabled) reproducirPing();
                }

                alert('Orden actualizada correctamente');
            } catch (error) {
                alert('Error al actualizar la orden');
            }
        }

        async function cambiarEstadoRapido(estado) {
            document.getElementById('modalEstado').value = estado;
            await guardarCambiosOrden();
        }

        async function eliminarOrden(id) {
            if (!currentUser || currentUser.rol !== 'admin') return;

            const ok = confirm('¿Seguro que querés eliminar esta orden?');
            if (!ok) return;

            try {
                const res = await fetch(`/api/mantenimientos/${id}`, {
                    method: 'DELETE'
                });

                const data = await res.json();

                if (!res.ok) {
                    alert(data.error || 'No se pudo eliminar');
                    return;
                }

                await cargarOrdenes();
                alert('Orden eliminada');
            } catch (error) {
                alert('Error eliminando orden');
            }
        }

        function formatearFecha(fecha) {
            if (!fecha) return 'No registrada';
            return new Date(fecha).toLocaleString();
        }

        window.addEventListener('resize', () => {
            if (calendar) {
                initCalendar();
                renderCalendar();
            }
        });

        window.addEventListener('DOMContentLoaded', async () => {
            const saved = localStorage.getItem('cmmsUser');

            if (saved) {
                try {
                    currentUser = JSON.parse(saved);
                    document.getElementById('loginScreen').classList.add('hidden');
                    document.getElementById('appScreen').classList.remove('hidden');
                    document.getElementById('userInfo').textContent =
                        `${currentUser.nombre} (${currentUser.rol})`;

                    aplicarPermisos();
                    initCalendar();
                    await cargarOrdenes();
                } catch (e) {
                    localStorage.removeItem('cmmsUser');
                }
            }
        });
    