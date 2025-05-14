import React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "./RulePage.css"
import rulevideo from "../../assets/videos/common1.mp4"
import BackgroundVideo from "../../components/common/global.tsx"

function RulePage() {
  const [ruleText, setRuleText] = useState<string>("확인할 설명을 선택하세요.")
  const navigate = useNavigate()


  const handleMain = (): void => {
    navigate("/main")
  }

  // 규칙 객체에 타입 정의 추가
  const rules: Record<string, string> = {
    battle: `
    1대1 온라인 포켓몬 카드게임
    - 배틀 덱 총 30장을 선택하여 방 입장합니다.
    - 내 손에 들고 있을수 있는 패는 8장입니다.
    - 선후공은 동전 던지기로 정합니다.
    - 유저의 체력은 1000으로 시작합니다.
    - 선공 유저에게는 1장, 후공 유저에게는 2장이 부여되며 시작됩니다.
    - 첫 턴에는 1코스트의 카드만 사용 가능합니다.
    - 턴이 돌아올 때 마다 카드 1장씩 드로우됩니다.
    - 턴 종료 버튼을 누를경우 다음턴으로 1증가합니다.
    - 배틀에서 승리시 300원, 패배시 100원 획득합니다.`,

    economy: ` 
    - 회원가입 시 초기 금액 1200원을 획득합니다.
    - 상점 카드팩의 가격은 S카드팩 500원, A카드팩 300원, B카드팩 100원입니다.`,

    deckSetting: `
    - 배틀 덱의 30장의 카드 중 전설은 2장으로 제한됩니다.
    - 손패 8장의 카드가 꽉차면 드로우는 불가능합니다.
    - 만약 들고 있는 패 중에 필요가 없는 카드는 버릴 수 있습니다.`,

    developer: `배틀페이지 내 핸드에서 카드 좌클릭->카드존으로 카드올라감. 우클릭->확대 카드존에서 우클릭->메뉴오픈 , 좌클릭->드래그 가능`,
  }

  return (
    <div className="rule-body">
      <div className="rule-page">
      <BackgroundVideo src={rulevideo} opacity={1} zIndex={-1}/>
        <button className="rule-mainbutton" onClick={handleMain}>
          메인페이지
        </button>

        <div className="rule-buttons">
          <button onClick={() => setRuleText(rules.battle)}>배틀 설명</button>
          <button onClick={() => setRuleText(rules.economy)}>상점 설명</button>
          <button onClick={() => setRuleText(rules.deckSetting)}>덱 설정 설명</button>
          <button onClick={() => setRuleText(rules.developer)}>개발자 주석</button>
        </div>

        <div className="rule-display">
          {ruleText.split("\n").map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>
      </div>
    </div>
  )
}

export default RulePage

