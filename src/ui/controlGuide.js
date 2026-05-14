export function shouldShowControlGuide({ stage, totalScore, scoreState }) {
  return stage === 1 && !totalScore && !scoreState;
}

export function getControlGuideRows({ controlMode, dodgeKey, mobileMode }) {
  if (mobileMode) {
    return [
      ['이동', '왼쪽 조이스틱'],
      ['구르기', '오른쪽 구르기 버튼'],
      ['QTE', '화면에 뜨는 프롬프트를 타이밍에 맞춰 터치'],
      ['폭탄', '폭탄 버튼으로 위험한 패턴 제거'],
      ['목표', '피하면서 QTE를 성공시켜 높은 점수 얻기'],
    ];
  }

  return [
    ['이동', controlMode === 'wasd' ? 'WASD' : '방향키'],
    ['구르기', dodgeKey === 'SPACE' ? 'Space' : 'Shift'],
    ['QTE', '화면에 뜨는 키를 타이밍에 맞춰 입력'],
    ['폭탄', 'Y 키로 위험한 패턴 제거'],
    ['목표', '피하면서 QTE를 성공시켜 높은 점수 얻기'],
  ];
}
