https://claude.ai/chat/3a0ed444-bb95-470f-b8ca-d6aca5fe4a7e

repositorio :https://github.com/AnalisisNumericoY/proyecto-SoyBienmedico
desplegado en RailWay

link de despliegue: https://proyecto-soybienmedico-production.up.railway.app/





Para ejecurar n local : 
Abrir terminal en el directorio del proyecto:
cd "d:\Users\Jose Antonio Solano\Documents\AsResearch_D\InvestigacionDesarrollo\SoyBienmedico"


2 Ejecutar el servidor: npm start
ó
node server.js

3. abrir el navegador : 
http://localhost:3000





Quiero un proyecto que tenga una página web con  login que accedan pacientes y medicos y 
secretarias, que permita que las secretarias hagan citas por medio de un calendario entre 
los pacientes y los médicos. Y que el encuentro se haga dentro de la página usando una video llamada. 
Durante la videollamada las dos personas tienen que estar logueadas en la aplicacion web, y durante la 
videollamada el medico debe ver la pantalla dividida en dos partes en el lado izquierdo la videollamada 
y en el lado derecho ver un formulario  para irlo llenando con información del paciente (por ejemplo: describa el dolor, edad, motivo de consulta).

El repositorio en github se va a llamar "proyecto-SoyBienmedico"

Entonces necesito que me ayudes a estructurar el proyecto
en carpetas teniendo en cuenta todas las funcionalidades que 
ya te he dicho y que aqui te repito:
1. Debe tener tres módulos: administrador, medicos, pacientes
2. Se debe ingresar con usuario y contraseña entonces tiene que haber una tabla en la base de datos o por ahora tener los 
datos en un archivo json en local en la carpeta del repositorio.
3. El administrador puede hacer lo siguiente en su módulo:
* crear medico nuevo (nombre -- string, identificación -- string, registro médico -- string, correo electrónico --string)
* programar y agendar citas
* El administrador puede ver todas las citas programadas por un médico, o puede tambien consultar todas las 
citas por un paciente. En ambos casos con su numero de identificacion. 
* debe tener una pestaña para consultar con la identificacion del paciente todas las historias clinicas de cada cita que tuvo el paciente
osea: cuando hay una cita medica entre el paciente y el medico, el medico le hace unas preguntas al paciente llena un formaulario y cuando 
se acaba la cita se salva el formulario en formato pdf para que se quede como respaldo de la cita y se le puede dar al paciente si él lo
solicita PERO lo que si se debe hacer obligatoriamente es que el sistema lo guarde para puede ser con la fecha de la cita.
* El administrador NO debe tener acceso a ninguna cita o sea que no tiene que tener la funcionalidad de la cámara para la video llamada. 
* El adiministrador puede crear nuevos pacientes, entonces hay que crear un formulario que creé a los nuevos pacientes, y que guarde esos datos 
en una base de datos que va a ser supabase (por ahora podemos usar un archivo JSON local). Los datos que se tienen que pedir en el formulario de creación de nuevo paciente son:
Fecha de registro -- no se si esto lo da automaticamente el sistma?, 
TipoDeDocumento -- esto que se pueda seleccionar de un desplegable con las siguientes opciones: Cédula de ciudadanía, Pasaporte, cedula de extranjería, Permiso de trabajo
NumeroDeDocumento -- string,
Nombre -- string,
Apellidos -- string,
Sexo -- esto es un desplegable:  opción 1: hombre, opción 2: mujer, opción 3: No Responde 
FechaDeNacimiento: que se abrá un calendario y el usuario coloque la fecha
Ocupación -- esto es un desplegable:  opción 1: empleado, opción 2: desemplado, opción 3: jubilado, opción 4: independiente  
Teléfono -- numérico se debe incluir el codigo del país.
EstadoCivil: -- esto es un desplegable:  opción 1: casado(a), opción 2: soltero(a), opción 3: viudo(a), opción 4: divorciado(a)
Email: -- string
EPS: -- string
RégimenEnSalud: -- string
Dirección: -- string
Barrio: string
RH: esto es un desplegable para que seleccione uno de estas opciones: 
A+ (A positivo)
A− (A negativo)
B+ (B positivo)
B− (B negativo)
AB+ (AB positivo)
AB− (AB negativo)
O+ (O positivo)
O− (O negativo)

4. El paciente puede hacer lo siguiente en su módulo:
* puede ver sus citas agendadas
* puede ver sus registros en pdf de las citas que ya tuvo
* unirse a la video llamada con el medico en la cita programada

5. El médico puede hacer lo siguiente en su módulo:
* puede ver las citas agendadas 
* unirse a la video llamada con el paciente en la cita programada
* Durante la cita medica en la videollamada el medico debe ver un formulario en su lado derecho de la pantalla, 
el formulario es para llenarlo haciendole preguntas al paciente, la primera pregunta que es la identificación del paciente 
el meédico la escribe en el formulario y el formulario automaticamente le llena los datos personales PORQUE como ya se la
administradora tuvo que haber hecho el registro antes entonces le puede llenar automaticamente el nombre, RH, telefono etcetera. 
El formulario completo para la consulta debe llevar lo siguiente:
Fecha de la consulta: -- no se si esto lo da automaticamente el sistma?  	
RegistroMédicoDelDoctor: -- string	
Identificación del paciente: -- string cuando se proporciona se deben traer varios datos del paciente que se van a usar en este formulario 
Nombre completo del paciente -- se debe traer de la informacion del paciente	 	
Motivo de consulta -- string el médico debe escribir o sea debe tener un campo grande para escibir maximo 5000 palabras	
Objeto de la tele orientación  -- string el médico debe escribir o sea debe tener un campo grande para escibir maximo 5000 palabras	 	
Antecedentes: string el médico debe escribir o sea debe tener un campo grande para escibir maximo 5000 palabras	  	
Tabaquismo : desplegable opcion 1 : Si    opcion 2: NO 	
Presión arterial sistólica : numérica	
Presion arterial diastólica : numérica	
Peso (KG): numérica 	
Talla (CM) : numérica	
Actividad Física : string	
Conducta : string el médico debe escribir o sea debe tener un campo grande para escibir maximo 5000 palabras	  		
Especialidad que requiere: string	
Canalizaciones	: desplegable: opcion 1:juventud opcion 2:niños opcion 3:6 Atención en salud a la Adultez (29 a 59 años) opcion 4:7 Atención en salud Vejez (60 años y mas) opcion 5: 35 Programa de Enfermedades Cronicas PIC HTA,DM,EPOC,Obesidad). 

Todos estos datos se deben guardar en un PDF agregandole al final del pdf la firma del médico.

No olvides darme el package.json para conectarme a supabase aunque por ahora podemos trabajar 
guardando los datos en JSON.


Me parece que si todo lo vas a programar en java script eso va a ser bueno porque se puede integra con otras tecnologías. Cierto?









package.json

proyecto-SoyBienmedico/
├── README.md
├── package.json
├── .env.example
├── .gitignore
├── server.js
├── public/
│   ├── index.html
│   ├── css/
│   │   ├── styles.css
│   │   ├── login.css
│   │   ├── dashboard.css
│   │   ├── calendar.css
│   │   └── videocall.css
│   ├── js/
│   │   ├── login.js
│   │   ├── admin/
│   │   │   ├── dashboard.js
│   │   │   ├── crear-medico.js
│   │   │   ├── crear-paciente.js
│   │   │   ├── programar-citas.js
│   │   │   ├── consultar-citas.js
│   │   │   └── historias-clinicas.js
│   │   ├── medico/
│   │   │   ├── dashboard.js
│   │   │   ├── mis-citas.js
│   │   │   ├── videocall.js
│   │   │   └── formulario-consulta.js
│   │   ├── paciente/
│   │   │   ├── dashboard.js
│   │   │   ├── mis-citas.js
│   │   │   ├── mis-historias.js
│   │   │   └── videocall.js
│   │   └── shared/
│   │       ├── calendar.js
│   │       ├── webrtc.js
│   │       ├── pdf-generator.js
│   │       └── utils.js
│   └── pages/
│       ├── admin/
│       │   ├── dashboard.html
│       │   ├── crear-medico.html
│       │   ├── crear-paciente.html
│       │   ├── programar-citas.html
│       │   ├── consultar-citas.html
│       │   └── historias-clinicas.html
│       ├── medico/
│       │   ├── dashboard.html
│       │   ├── mis-citas.html
│       │   └── videocall.html
│       └── paciente/
│           ├── dashboard.html
│           ├── mis-citas.html
│           ├── mis-historias.html
│           └── videocall.html
├── data/
│   ├── users.json
│   ├── medicos.json
│   ├── pacientes.json
│   ├── citas.json
│   └── historias-clinicas.json
├── uploads/
│   └── historias-pdf/
├── config/
│   ├── database.js
│   └── supabase.js
└── routes/
    ├── auth.js
    ├── admin.js
    ├── medico.js
    ├── paciente.js
    └── api.js






























*****************************************************************************************************************
                                         Credenciales
*****************************************************************************************************************

Admin: secretary@hospital.com / 123456
Médico: admin@hospital.com / 123456
Paciente: patient@hospital.com / 123456



cuando se crea el paciente agregar ....... poenrle el PROGRAMA --- ecopetrol



agregar dos pestañas : 
tamizaje de : deveulve : Riesgo cardiovascular                    (se hace en 5 minutos en la capsula)
tamizaje en salud mental : 1 cuestionario dividido en tes partes  (se hace en 5 minutos en la capsula)


301 325 9182 FNG
proceso juridico





