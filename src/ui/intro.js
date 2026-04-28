/**
 * 인트로 화면 및 설정 UI 관리 (DOM 기반)
 */
import { loadSettings, saveSettings } from '../utils/settings.js';
import { STAGE } from '../constants/game.js';

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

    // 게임 시작 버튼
    document.getElementById('btn-start').addEventListener('click', () => {
      document.getElementById('mode-select-popup').style.display = 'flex';
    });

    // 선택된 스테이지 번호를 반환
    function getSelectedStage() {
      const sel = document.getElementById('qa-stage-select');
      return sel ? parseInt(sel.value, 10) : 1;
    }

    // 모드 선택: 이지
    document.getElementById('btn-easy').addEventListener('click', () => {
      closeModePopup();
      const currentSettings = loadSettings();
      window.startGame('easy', currentSettings, getSelectedStage());
    });

    // 모드 선택: 노말
    document.getElementById('btn-normal').addEventListener('click', () => {
      closeModePopup();
      const currentSettings = loadSettings();
      window.startGame('normal', currentSettings, getSelectedStage());
    });

    // 모드 선택 팝업 닫기
    document.getElementById('btn-mode-cancel').addEventListener('click', closeModePopup);

    // 옵션 버튼
    document.getElementById('btn-options').addEventListener('click', () => {
      document.getElementById('options-panel').style.display = 'flex';
    });

    // 옵션 저장
    document.getElementById('btn-options-save').addEventListener('click', () => {
      const controlMode = document.querySelector('input[name="controlMode"]:checked').value;
      const dodgeKey = document.querySelector('input[name="dodgeKey"]:checked').value;
      saveSettings({ controlMode, dodgeKey });
      document.getElementById('options-panel').style.display = 'none';
      console.log('[UI] 설정 저장:', { controlMode, dodgeKey });
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
  label.textContent = 'STAGE:';
  label.style.cssText = 'font-family:monospace;font-size:12px;color:#7c7caa;';

  const select = document.createElement('select');
  select.id = 'qa-stage-select';
  select.style.cssText = 'font-family:monospace;font-size:12px;background:#1a1a3e;color:#a0a0cc;border:1px solid #3a3a6e;border-radius:4px;padding:4px 8px;cursor:pointer;';
  for (let i = 1; i <= STAGE.TOTAL; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = i + (STAGE.BOSS_STAGES.includes(i) ? ' (BOSS)' : '');
    select.appendChild(opt);
  }

  wrapper.appendChild(label);
  wrapper.appendChild(select);
  intro.appendChild(wrapper);
}

function closeModePopup() {
  document.getElementById('mode-select-popup').style.display = 'none';
}

function applySettingsToUI(settings) {
  const controlRadio = document.querySelector(`input[name="controlMode"][value="${settings.controlMode}"]`);
  if (controlRadio) controlRadio.checked = true;

  const dodgeRadio = document.querySelector(`input[name="dodgeKey"][value="${settings.dodgeKey}"]`);
  if (dodgeRadio) dodgeRadio.checked = true;
}
