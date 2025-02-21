document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const usuario = document.getElementById('nombre_usuario').value.trim();
    const contrasenia = document.getElementById('password').value.trim();

    if (!usuario || !contrasenia) {
        alert("Por favor, complete ambos campos.");
        return;
    }

    fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ usuario: usuario, contrasenia: contrasenia })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Response from server:', data);

        if (data.success) {
            // Guardamos los datos en localStorage
            localStorage.setItem('userId', data.userId); // Guardamos el ID
            localStorage.setItem('userName', data.nombre_usuario); // Guardamos el nombre de usuario
            window.location.href = 'index.html'; // Redirigir al perfil
        } else {
            alert('Login Fallido: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert("Ocurrió un error al procesar la solicitud.");
    });
});