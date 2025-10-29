Instrucciones - styles/

- Estilos globales y de layout principal (App.css, index.css) viven aquí.
- Agrega variables, resets y utilidades compartidas.
- No coloques estilos de componentes o páginas; usa fcStyles/ y pagesStyles/.


 * 💡 ¿Es necesario dividir App.css en diferentes archivos?
 * 
 * Sí, dividir App.css en archivos más pequeños y específicos mejora la mantenibilidad,
 * escalabilidad y claridad de los estilos, especialmente a medida que la aplicación crece.
 * Esto facilita la reutilización de estilos, reduce conflictos y optimiza el trabajo en equipo.
 * 
 * 🚀 Ideas para modularización de CSS:
 * 
 * 1.  **Estilos por componente:**  
 *     - Crea un archivo CSS para cada componente React importante.
 *     - Ejemplo: `Button.css`, `Sidebar.css`, `Header.css`, `LoginForm.css`
 *     - Guarda estos archivos en una carpeta, por ejemplo: `/src/fcStyles/`
 *     - Importa el archivo de estilos en el componente correspondiente.
 * 
 * 2. **Estilos globales y resets:**
 *     - Mantén un archivo dedicado como `index.css` o `globals.css` sólo para resets, fuentes globales y estilos compartidos.
 * 
 * 3. **Estilos por páginas:**  
 *     - Si una vista/página necesita muchos estilos únicos, crea un archivo CSS por página.
 *     - Ejemplo: `HomePage.css`, `LoginPage.css`
 * 
 * 4. **Variables y utilidades:**
 *     - Centraliza variables de color, fuentes, gaps, etc. en un archivo como `variables.css` o usa CSS custom properties.
 *     - Para estilos utilitarios (márgenes, paddings pequeños) considera un archivo `utils.css`
 * 
 * 5. **Bloques lógicos (BEM o similar):**
 *     - Si usas convenciones como BEM, agrupa estilos por bloque.
 * 
 * 👩‍💻 **Instrucciones para mantener la modularidad en el futuro:**
 * 
 * - Siempre que crees un nuevo componente o página, pregunta:  
 *   ¿Necesita sus propios estilos? Si sí, crea un archivo dedicado y uno por componente/página.
 * - Importa sólo los estilos necesarios en cada componente para evitar cargas innecesarias.
 * - Nombra los archivos y las clases de forma descriptiva, consistente y predecible.
 * - Evita estilos globales innecesarios dentro de los archivos de componente.
 * - Documenta brevemente la función de nuevos archivos de estilos.
 * - Si el proyecto crece mucho, considera migrar a CSS Modules, SASS o una solución CSS-in-JS.
 * 
 * 🗂️ **Ejemplo de estructura de carpetas recomendada:**
 * 
 * src/
 * ├─ fcStyles/                # Estilos específicos de componentes (Button.css, Sidebar.css...)
 * ├─ styles/                  # Estilos globales y layout principal (App.css, index.css, variables.css)
 * └─ pages/                   # Páginas de la app
 * 
 */