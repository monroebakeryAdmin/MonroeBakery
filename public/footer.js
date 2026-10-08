// Shared footer content for every page. Loaded with defer after HTML is parsed.
(() => {
  const footer = document.getElementById('site-footer');
  if (!footer) return;

  footer.innerHTML = `
    <div class="footer-content">
      <p class="footer-copyright">&copy; ${new Date().getFullYear()} Monroe Bakery. All Rights Reserved.</p>
      <p class="footer-address">2611 Monroe St, Dearborn, MI 48124</p>
      <nav class="footer-socials" aria-label="Social media">
        <a href="https://www.instagram.com/monroe_bakery_mi/" target="_blank" rel="noopener noreferrer">
          <i class="bi bi-instagram" aria-hidden="true"></i><span>Instagram</span>
        </a>
        <a href="https://www.facebook.com/share/1D61aYNFvg/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer">
          <i class="bi bi-facebook" aria-hidden="true"></i><span>Facebook</span>
        </a>
      </nav>
    </div>`;
})();
