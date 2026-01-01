// ============================================
// ABOUT US PAGE - SMOOTH SCROLL REVEAL ANIMATIONS
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  
  // Load Header and Sidebar with correct file names
  fetch('Header.html')
    .then(response => {
      if (!response.ok) {
        throw new Error('Header file not found');
      }
      return response.text();
    })
    .then(data => {
      document.getElementById('header').innerHTML = data;
      
      // Load and execute header script
      const headerScript = document.createElement('script');
      headerScript.src = 'JS/header.js';
      document.body.appendChild(headerScript);
    })
    .catch(error => console.error('Error loading header:', error));

  fetch('Sidebar.html')
    .then(response => {
      if (!response.ok) {
        throw new Error('Sidebar file not found');
      }
      return response.text();
    })
    .then(data => {
      document.getElementById('sidebar').innerHTML = data;
      
      // Load and execute sidebar script
      const sidebarScript = document.createElement('script');
      sidebarScript.src = 'JS/Sidebar.js';
      document.body.appendChild(sidebarScript);
    })
    .catch(error => console.error('Error loading sidebar:', error));

  // ============================================
  // SMOOTH SCROLL REVEAL ON VIEWPORT ENTRY
  // ============================================
  
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  };

  // Create main intersection observer
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('revealed');
        }, index * 100);
        revealObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // ============================================
  // SETUP REVEAL ANIMATIONS
  // ============================================
  
  // Add reveal class to all animated elements
  const revealElements = document.querySelectorAll(`
    .hero-badge,
    .hero-title,
    .hero-description,
    .hero-stat,
    .about-image-wrapper,
    .about-content,
    .section-label,
    .section-heading,
    .section-text,
    .feature-item,
    .service-card,
    .why-item,
    .why-choose-images,
    .team-card,
    .cta-content
  `);

  revealElements.forEach((element, index) => {
    element.classList.add('reveal');
    revealObserver.observe(element);
  });

  // Add CSS for reveal animations
  const revealStyles = document.createElement('style');
  revealStyles.textContent = `
    .reveal {
      opacity: 0;
      transform: translateY(50px);
      transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }

    .reveal.revealed {
      opacity: 1;
      transform: translateY(0);
    }

    /* Hero specific animations */
    .hero-badge.reveal {
      transform: translateY(-30px);
    }

    .hero-stat.reveal {
      transform: scale(0.8);
    }

    .hero-stat.revealed {
      transform: scale(1);
    }

    /* Side animations */
    .about-image-wrapper.reveal,
    .feature-item.reveal {
      transform: translateX(-50px);
    }

    .about-content.reveal {
      transform: translateX(50px);
    }

    /* Zoom animations */
    .service-card.reveal,
    .team-card.reveal {
      transform: scale(0.9);
      opacity: 0;
    }

    .service-card.revealed,
    .team-card.revealed {
      transform: scale(1);
      opacity: 1;
    }

    /* Images */
    .why-choose-images.reveal {
      transform: translateX(50px);
    }
  `;
  document.head.appendChild(revealStyles);

  // ============================================
  // COUNTER ANIMATION FOR HERO STATS
  // ============================================
  
  function animateValue(element, start, end, duration, suffix = '') {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const current = Math.floor(progress * (end - start) + start);
      element.textContent = current + suffix;
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }

  // Observe hero stats section
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const stats = [
          { element: entry.target.querySelectorAll('.stat-number')[0], end: 10000, suffix: 'K+', display: '10K+' },
          { element: entry.target.querySelectorAll('.stat-number')[1], end: 98, suffix: '%', display: '98%' },
          { element: entry.target.querySelectorAll('.stat-number')[2], end: 9, suffix: '+', display: '9+' }
        ];

        stats.forEach((stat, index) => {
          if (stat.element) {
            setTimeout(() => {
              if (stat.suffix === 'K+') {
                animateValue(stat.element, 0, 10, 2000, '');
                setTimeout(() => {
                  stat.element.textContent = '10K+';
                }, 2000);
              } else if (stat.suffix === '%') {
                animateValue(stat.element, 0, 98, 2000, '%');
              } else {
                animateValue(stat.element, 0, 9, 1500, '+');
              }
            }, index * 200);
          }
        });
        statsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  const heroStats = document.querySelector('.hero-stats');
  if (heroStats) {
    statsObserver.observe(heroStats);
  }

  // ============================================
  // SCROLL INDICATOR SMOOTH SCROLL
  // ============================================
  
  const scrollIndicator = document.querySelector('.scroll-indicator');
  if (scrollIndicator) {
    scrollIndicator.addEventListener('click', () => {
      const aboutSection = document.querySelector('.about-section');
      if (aboutSection) {
        aboutSection.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    });

    // Hide scroll indicator on scroll
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;
      if (currentScroll > 300) {
        scrollIndicator.style.opacity = '0';
        scrollIndicator.style.pointerEvents = 'none';
      } else {
        scrollIndicator.style.opacity = '1';
        scrollIndicator.style.pointerEvents = 'auto';
      }
      lastScroll = currentScroll;
    });
  }

  // ============================================
  // PARALLAX EFFECT ON HERO OVERLAY
  // ============================================
  
  const heroOverlay = document.querySelector('.hero-overlay');
  if (heroOverlay) {
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      if (scrolled < window.innerHeight) {
        heroOverlay.style.transform = `translateY(${scrolled * 0.3}px)`;
      }
    });
  }

  // ============================================
  // STAGGERED ANIMATION FOR GRID ITEMS
  // ============================================
  
  function staggerAnimation(containerSelector, itemSelector, delay = 150) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const items = container.querySelectorAll(itemSelector);
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          items.forEach((item, index) => {
            setTimeout(() => {
              item.classList.add('revealed');
            }, index * delay);
          });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    observer.observe(container);
  }

  // Apply staggered animations
  staggerAnimation('.services-grid', '.service-card', 150);
  staggerAnimation('.team-grid', '.team-card', 100);
  staggerAnimation('.why-choose-list', '.why-item', 120);
  staggerAnimation('.about-features', '.feature-item', 100);

  // ============================================
  // HOVER EFFECTS ENHANCEMENT
  // ============================================
  
  // Service cards hover effect
  const serviceCards = document.querySelectorAll('.service-card');
  serviceCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-15px)';
    });
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
    });
  });

  // Team cards hover effect
  const teamCards = document.querySelectorAll('.team-card');
  teamCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      const overlay = this.querySelector('.team-overlay');
      if (overlay) {
        overlay.style.transform = 'translateY(0)';
      }
    });
    card.addEventListener('mouseleave', function() {
      const overlay = this.querySelector('.team-overlay');
      if (overlay) {
        overlay.style.transform = 'translateY(100%)';
      }
    });
  });

  // ============================================
  // IMAGE LAZY LOAD EFFECT
  // ============================================
  
  const images = document.querySelectorAll('.about-image, .why-image-main, .why-image-small, .team-image img');
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'scale(1)';
        imageObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  images.forEach(img => {
    img.style.opacity = '0';
    img.style.transform = 'scale(0.95)';
    img.style.transition = 'all 0.8s ease';
    imageObserver.observe(img);
  });

  // ============================================
  // SMOOTH SCROLL FOR ALL INTERNAL LINKS
  // ============================================
  
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // ============================================
  // INITIALIZE MESSAGE
  // ============================================
  
  console.log('✨ About Us page animations initialized successfully!');
  console.log('📊 Scroll reveal animations active');
  console.log('🎯 Counter animations ready');
  console.log('🎨 Hover effects enhanced');
});