/**
 * 인트로 화면 및 설정 UI 관리 (DOM 기반)
 */
import { loadSettings, saveSettings } from '../utils/settings.js';
import { STAGE } from '../constants/game.js';
import { gameFlowBus, GAME_FLOW_EVENTS } from '../flow/gameFlowBus.js';

/**
 * DOM UI 초기화 - 이벤트 바인딩
 */
export function initUI() {
  document.addEventListener('DOMContentLoaded', () => {
    const settings = loadSettings();

    // 설정 UI에 현재 값 반영
    applySettingsToUI(settings);

    // QA 스테이지 셀렉트 삽입
    _createStageSelect();

    // 선택된 스테이지 번호를 반환
    function getSelectedStage() {
      const sel = document.getElementById('qa-stage-select');
      return sel ? parseInt(sel.value, 10) : 1;
    }

    // 게임 시작 — normal 모드 단일 (EASY 모드 삭제됨)
    document.getElementById('btn-start').addEventListener('click', () => {
      const currentSettings = loadSettings();
      gameFlowBus.emit(GAME_FLOW_EVENTS.START_REQUESTED, {
        mode: 'normal',
        settings: currentSettings,
        startStage: getSelectedStage(),
      });
    });

    // 옵션 버튼
    document.getElementById('btn-options').addEventListener('click', () => {
      document.getElementById('options-panel').style.display = 'flex';
    });

    // 모바일 모드 체크박스 → 슬라이더 행 표시/숨김
    document.getElementById('opt-mobile').addEventListener('change', (e) => {
      document.getElementById('mobile-scale-row').style.display = e.target.checked ? 'flex' : 'none';
    });

    // 스케일 슬라이더 → 레이블 실시간 업데이트
    document.getElementById('opt-scale').addEventListener('input', (e) => {
      document.getElementById('scale-value').textContent = parseFloat(e.target.value).toFixed(1);
    });

    // 옵션 저장
    document.getElementById('btn-options-save').addEventListener('click', () => {
      const controlMode = document.querySelector('input[name="controlMode"]:checked').value;
      const dodgeKey = document.querySelector('input[name="dodgeKey"]:checked').value;
      const mobileMode = document.getElementById('opt-mobile').checked;
      const touchControlScale = parseFloat(document.getElementById('opt-scale').value);
      saveSettings({ controlMode, dodgeKey, mobileMode, touchControlScale });
      document.getElementById('options-panel').style.display = 'none';
      console.log('[UI] 설정 저장:', { controlMode, dodgeKey, mobileMode, touchControlScale });
    });

    // 옵션 취소
    document.getElementById('btn-options-cancel').addEventListener('click', () => {
      const settings = loadSettings();
      applySettingsToUI(settings);
      document.getElementById('options-panel').style.display = 'none';
    });

    console.log('[UI] 인트로 UI 초기화 완료');
  });
}

/**
 * QA용 스테이지 셀렉트 UI를 인트로 화면에 동적 삽입
 */
function _createStageSelect() {
  const intro = document.getElementById('intro-screen');
  if (!intro) return;

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:absolute;bottom:16px;right:16px;z-index:5;display:flex;align-items:center;gap:8px;';

  const label = document.createElement('span');
  label.textContent = '스테이지:';
  label.style.cssText = 'font-family:monospace;font-size:12px;color:#7c7caa;';

  const select = document.createElement('select');
  select.id = 'qa-stage-select';
  select.style.cssText = 'font-family:monospace;font-size:12px;background:#1a1a3e;color:#a0a0cc;border:1px solid #3a3a6e;border-radius:4px;padding:4px 8px;cursor:pointer;';
  for (let i = 1; i <= STAGE.TOTAL; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = i + (STAGE.BOSS_STAGES.includes(i) ? ' (보스)' : '');
    select.appendChild(opt);
  }

  wrapper.appendChild(label);
  wrapper.appendChild(select);
  intro.appendChild(wrapper);
}

function applySettingsToUI(settings) {
  const controlRadio = document.querySelector(`input[name="controlMode"][value="${settings.controlMode}"]`);
  if (controlRadio) controlRadio.checked = true;

  const dodgeRadio = document.querySelector(`input[name="dodgeKey"][value="${settings.dodgeKey}"]`);
  if (dodgeRadio) dodgeRadio.checked = true;

  const mobileCheckbox = document.getElementById('opt-mobile');
  if (mobileCheckbox) {
    if (settings.mobileMode === null || settings.mobileMode === undefined) {
      mobileCheckbox.checked = navigator.maxTouchPoints > 0;
    } else {
      mobileCheckbox.checked = settings.mobileMode;
    }
    const scaleRow = document.getElementById('mobile-scale-row');
    if (scaleRow) scaleRow.style.display = mobileCheckbox.checked ? 'flex' : 'none';
  }
  const scaleSlider = document.getElementById('opt-scale');
  if (scaleSlider) {
    scaleSlider.value = settings.touchControlScale || 1.0;
    const scaleLabel = document.getElementById('scale-value');
    if (scaleLabel) scaleLabel.textContent = (settings.touchControlScale || 1.0).toFixed(1);
  }
}
