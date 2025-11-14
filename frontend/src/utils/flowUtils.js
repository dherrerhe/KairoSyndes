// Utilidades simples

export function getId() {
  return `temp_${Math.random().toString(36).substr(2, 9)}`;
}

export async function getUserIP() {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip;
  } catch (err) {
    console.warn('No se pudo obtener IP:', err);
    return 'IP no disponible';
  }
}