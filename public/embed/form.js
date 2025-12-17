(function() {
  window.SuccessForm = {
    embed: function(formId, containerId) {
      const container = document.getElementById(containerId);
      if (!container) {
        console.error('Container element not found:', containerId);
        return;
      }

      // Get base URL from script tag or default
      const scripts = document.getElementsByTagName('script');
      let baseUrl = 'https://www.success.com';

      for (let i = 0; i < scripts.length; i++) {
        if (scripts[i].src && scripts[i].src.includes('form.js')) {
          const url = new URL(scripts[i].src);
          baseUrl = url.origin;
          break;
        }
      }

      // Create iframe
      const iframe = document.createElement('iframe');
      iframe.src = baseUrl + '/forms/' + formId;
      iframe.style.width = '100%';
      iframe.style.border = 'none';
      iframe.style.minHeight = '500px';
      iframe.setAttribute('scrolling', 'no');
      iframe.setAttribute('frameborder', '0');

      // Auto-resize iframe based on content
      window.addEventListener('message', function(event) {
        if (event.origin !== baseUrl) return;

        if (event.data.type === 'formHeight') {
          iframe.style.height = event.data.height + 'px';
        }
      });

      // Append iframe to container
      container.innerHTML = '';
      container.appendChild(iframe);
    }
  };
})();
