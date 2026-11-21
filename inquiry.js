/* Client-side inquiry draft only: no upload, storage, or automatic sending. */
(() => {
  'use strict';
  const recipient = 'hwamunseok@gmail.com';
  const clean = value => String(value || '').trim();
  const singleLine = value => clean(value).replace(/[\r\n]+/g, ' ');
  function buildInquiry(values) {
    const name = singleLine(values.name);
    const product = singleLine(values.product) || '상담하며 결정';
    const purpose = singleLine(values.purpose) || '아직 고민 중';
    const subject = '[강화도령화문석 상담] ' + product + ' / ' + name;
    const body = [
      '강화도령화문석 상담 문의',
      '',
      '성함·단체명: ' + name,
      '연락처: ' + (singleLine(values.contact) || '보낸 이메일로 회신 부탁드립니다.'),
      '',
      '관심 작품: ' + product,
      '사용 목적: ' + purpose,
      '놓을 공간·사용 방식: ' + (clean(values.space) || '상담하며 결정'),
      '희망 규격: ' + (singleLine(values.size) || '미정'),
      '필요 수량: ' + (singleLine(values.quantity) ? singleLine(values.quantity) + '개' : '미정'),
      '희망 일정: ' + (singleLine(values.timing) || '미정'),
      '',
      '추가 문의:',
      clean(values.message) || '없음'
    ].join('\r\n');
    return {
      recipient, subject, body,
      href: 'mailto:' + recipient + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body),
      copyText: '받는 사람: ' + recipient + '\r\n제목: ' + subject + '\r\n\r\n' + body
    };
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { buildInquiry };
    return;
  }
  const form = document.querySelector('#inquiry-form');
  if (!form) return;
  const fields = document.querySelector('#inquiry-fields');
  const product = form.elements.namedItem('product');
  const query = new URLSearchParams(location.search);
  const productId = (query.get('product') || '').toUpperCase();
  const validProduct = Array.from(product.options).find(option => option.value === productId && option.value);
  if (validProduct) {
    product.value = validProduct.value;
    document.querySelector('#product-note').textContent = '보고 계시던 작품을 선택해 두었습니다. 다른 작품으로 바꾸셔도 됩니다.';
  }
  product.addEventListener('change', () => {
    document.querySelector('#product-note').textContent = product.value ? '선택하신 작품을 바탕으로 상담 내용을 정리합니다.' : '정해진 작품이 없어도 괜찮습니다.';
  });
  if (query.get('purpose') === 'collaboration') {
    form.querySelector('input[name="purpose"][value="전시·협업"]').checked = true;
  }
  const review = document.querySelector('#inquiry-review');
  const preview = document.querySelector('#inquiry-body');
  const mail = document.querySelector('#inquiry-mail');
  const status = document.querySelector('#inquiry-status');
  const stepWrite = document.querySelector('#step-write');
  const stepReview = document.querySelector('#step-review');
  let draft;
  form.elements.namedItem('name').addEventListener('input', event => event.target.setCustomValidity(''));
  form.addEventListener('submit', event => {
    event.preventDefault();
    const name = form.elements.namedItem('name');
    if (!clean(name.value)) {
      name.setCustomValidity('성함 또는 단체명을 입력해주세요.');
      name.reportValidity();
      return;
    }
    if (!form.reportValidity()) return;
    const values = Object.fromEntries(new FormData(form).entries());
    values.product = product.value ? product.selectedOptions[0].textContent : '';
    draft = buildInquiry(values);
    document.querySelector('#inquiry-subject').textContent = draft.subject;
    preview.value = draft.body;
    mail.href = draft.href;
    status.textContent = '';
    form.hidden = true;
    review.hidden = false;
    stepWrite.removeAttribute('aria-current');
    stepReview.setAttribute('aria-current', 'step');
    review.scrollIntoView({ block: 'start', behavior: 'instant' });
    document.querySelector('#review-title').focus({ preventScroll: true });
  });
  document.querySelector('#inquiry-edit').addEventListener('click', () => {
    review.hidden = true;
    form.hidden = false;
    stepReview.removeAttribute('aria-current');
    stepWrite.setAttribute('aria-current', 'step');
    product.focus();
  });
  document.querySelector('#inquiry-copy').addEventListener('click', async () => {
    if (!draft) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(draft.copyText);
      status.textContent = '받는 주소·제목·본문을 복사했습니다. 사용하시는 메일에 붙여넣어 보내주세요.';
    } catch {
      preview.focus();
      preview.select();
      status.textContent = '자동 복사가 되지 않아 본문을 선택했습니다. 복사한 뒤 위 주소로 메일을 보내주세요.';
    }
  });
  mail.addEventListener('click', () => {
    status.textContent = '메일 작성창에서 보내기를 눌러주세요. 열리지 않으면 문의 내용을 복사해 보내실 수 있습니다.';
  });
  fields.disabled = false;
})();
