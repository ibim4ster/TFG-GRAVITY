        const socket = io.connect();

        socket.on('connect', () => {
            document.getElementById('status').textContent = 'Conectado al servidor';
        });

        socket.on('disconnect', () => {
            document.getElementById('status').textContent = 'Desconectado';
        });

        socket.on('message', (data) => {
            console.log('Mensaje del servidor:', data.message);
        });

        socket.on('actualizacion', (data) => {
            console.log('Actualización recibida:', data);

            const userList = document.getElementById('user-list');
            userList.innerHTML = ''; // Limpiar la lista actual
            data.usuarios.forEach(user => {
                const li = document.createElement('li');
                li.textContent = `${user.nombre} (${user.estado})`;
                userList.appendChild(li);
            });
        });

        // Cargar datos iniciales
        fetch('/datos_iniciales')
            .then(response => response.json())
            .then(data => {
                socket.emit('actualizacion', data); // Enviar datos iniciales al cliente
            });
