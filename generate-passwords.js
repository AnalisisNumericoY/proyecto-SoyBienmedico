const bcrypt = require('bcryptjs');

async function generatePasswords() {
  const passwords = {
    'admin123': await bcrypt.hash('admin123', 10),
    'medico123': await bcrypt.hash('medico123', 10),
    'paciente123': await bcrypt.hash('paciente123', 10)
  };
  
  console.log('Contraseñas hasheadas:');
  console.log('admin123:', passwords['admin123']);
  console.log('medico123:', passwords['medico123']);
  console.log('paciente123:', passwords['paciente123']);
}

generatePasswords();
