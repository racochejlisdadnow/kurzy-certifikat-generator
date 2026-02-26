const printBtn = document.querySelector('.print-btn');
const printStyle = document.getElementById('print-style');
const nameInput = document.getElementById('nameInput');
const dateInput = document.getElementById('dateInput');
const courseButtons = document.querySelectorAll('.course-buttons button');
const certificateNode = document.querySelector('.certificate');

const courseContent = {
  'course-1': {
    intro: 'Tímto se potvrzuje, že',
    successLine: 'úspěšně absolvoval kurz',
    courseName: 'MISTR LAMENTOVÁNÍ',
    funnyLine: 'Oficiálně potvrzeno. Tento člověk nevypráví příběhy. On je zakládá.\nBorec.',
  },
  'course-2': {
    intro: 'Tímto se potvrzuje, že',
    successLine: 'úspěšně absolvoval kurz',
    courseName: 'DOKONALÉ AAAAH',
    funnyLine:
      'Oficiálně potvrzeno. Expert na rodinnou harmonii, ovládající sílu hlubokého,\nkrásného „aaaah“. Borec.',
  },
};

const updateField = (field, value) => {
  document.querySelectorAll(`[data-field="${field}"]`).forEach((node) => {
    node.textContent = value;
  });
};

const activateCourse = (key) => {
  const selected = courseContent[key];
  if (!selected) return;

  courseButtons.forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.course === key);
  });

  updateField('course-name', selected.courseName);
  updateField('intro', selected.intro);
  updateField('success-line', selected.successLine);
  updateField('funny-line', selected.funnyLine);
};

nameInput?.addEventListener('input', (event) => {
  updateField('name', event.target.value.trim() || 'Jméno a příjmení');
});

dateInput?.addEventListener('input', (event) => {
  updateField('date', event.target.value.trim() || '25. 2. 2026');
});

courseButtons.forEach((btn) => {
  btn.addEventListener('click', () => activateCourse(btn.dataset.course));
});

const downloadCertificatePdf = async () => {
  if (!certificateNode) {
    alert('Certifikát nebyl nalezen. PDF nelze vytvořit.');
    return;
  }

  const html2canvasLib = window.html2canvas;
  const jsPdfLib = window.jspdf?.jsPDF || window.jsPDF;
  if (!html2canvasLib || !jsPdfLib) {
    alert('PDF knihovny se nenačetly. Otevři stránku přes lokální server (ne file://).');
    return;
  }

  const originalLabel = printBtn?.textContent;

  try {
    if (printBtn) {
      printBtn.disabled = true;
      printBtn.textContent = 'Generuji PDF...';
    }

    await document.fonts?.ready;

    const pdf = new jsPdfLib({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const isSafari =
      /Safari/i.test(navigator.userAgent) &&
      !/Chrome|CriOS|Edg|OPR|Firefox|FxiOS/i.test(navigator.userAgent);

    // Safari-first export profile for stable output.
    const renderAttempts = isSafari
      ? [
          { scale: 2, type: 'PNG', quality: 1.0 },
          { scale: 1.7, type: 'PNG', quality: 1.0 },
          { scale: 1.5, type: 'JPEG', quality: 0.95 },
        ]
      : [
          { scale: 2, type: 'PNG', quality: 1.0 },
          { scale: 1.6, type: 'PNG', quality: 1.0 },
          { scale: 1.5, type: 'JPEG', quality: 0.95 },
        ];

    let exported = false;
    let lastError = null;

    for (const attempt of renderAttempts) {
      try {
        const canvas = await html2canvasLib(certificateNode, {
          scale: attempt.scale,
          useCORS: true,
          backgroundColor: null,
          allowTaint: false,
          logging: false,
        });

        const mime = attempt.type === 'PNG' ? 'image/png' : 'image/jpeg';
        const image = canvas.toDataURL(mime, attempt.quality);
        pdf.addImage(image, attempt.type, 0, 0, 297, 210, undefined, 'FAST');
        exported = true;
        break;
      } catch (attemptError) {
        lastError = attemptError;
      }
    }

    if (!exported) {
      throw lastError || new Error('Unknown PDF render error');
    }

    pdf.save('certifikat-kurzy-pro-borce.pdf');
  } catch (error) {
    console.error('PDF export failed:', error);
    alert(`PDF se nepodařilo vygenerovat: ${error?.message || error}`);
  } finally {
    if (printBtn) {
      printBtn.disabled = false;
      printBtn.textContent = originalLabel || 'Stahnout PDF / Tisk';
    }
  }
};

printBtn?.addEventListener('click', downloadCertificatePdf);

printStyle.textContent = '@page { size: A4 landscape; margin: 0; }';

if (courseButtons.length) {
  const activeButton = document.querySelector('.course-buttons .is-active') || courseButtons[0];
  activeButton?.click();
}
