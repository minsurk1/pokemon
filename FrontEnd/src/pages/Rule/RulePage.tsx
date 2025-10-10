import React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "./RulePage.css"
import rulevideo from "../../assets/videos/rulevideo.mp4"
import { FaHome } from "react-icons/fa";
import BackgroundVideo from "../../components/common/global"
import { HomeButton } from "../../components/common/button"

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
    - 내 손에 들고 있을 수 있는 패는 8장입니다.
    - 선후공은 동전 던지기로 정합니다.
    - 유저의 체력은 1000으로 시작합니다.
    - 선공 유저에게는 1장, 후공 유저에게는 2장이 부여되며 시작됩니다.
    - 첫 턴에는 1코스트의 카드만 사용 가능합니다.
    - 자기 턴으로 돌아올 때 마다 카드 드로우 기회가 1개가 주어집니다.
    - 필드 위에 올려진 카드가 파괴되면 묘지로 가게됩니다.
    - 만약 드로우 할 패가 없다면, 묘지에 모인 카드가 섞이게 되어 다시 드로우를 할 수 있게 됩니다.
    - 각 타입 별 상성이 존재합니다. 상성 별로 공격력이 상이하게 적용됩니다.
    - 턴 종료 버튼을 누를 경우 자신의 턴이 1 증가합니다.
    - 매 턴 제한 시간은 30초이며, 턴 제한은 30턴입니다.
    - 상대의 HP가 0이 되거나, 상대가 항복할 시 배틀에서 승리합니다.
    - 배틀에서 승리시 300원, 패배시 100원 획득합니다.`,

    economy: ` 
    - 회원가입 시 초기 금액 1200원을 획득합니다.
    - 상점 카드팩의 가격은 S카드팩 500원, A카드팩 300원, B카드팩 100원입니다.`,

    deckSetting: `
    - 배틀 덱의 30장의 카드 중 전설은 2장으로 제한됩니다.
    - 손패 8장의 카드가 꽉차면 드로우는 불가능합니다.
    - 만약 들고 있는 패 중에 필요가 없는 카드는 버릴 수 있습니다.`,

    developer: `
    -배틀페이지 내 핸드에서 카드 좌클릭->카드존으로 카드올라감 
    -우클릭->확대 카드존에서 우클릭->메뉴오픈 
    -좌클릭->드래그 가능`
  }

  return (
    <div className="rule-body">
      <div className="rule-page">
      <BackgroundVideo src={rulevideo} opacity={1} zIndex={-1}/>

        <div className="rule-buttons">
          <button onClick={() => setRuleText(rules.battle)}>배틀 설명</button>
          <button onClick={() => setRuleText(rules.economy)}>상점 설명</button>
          <button onClick={() => setRuleText(rules.deckSetting)}>덱 설정 설명</button>
          <button onClick={() => setRuleText(rules.developer)}>개발자 주석</button>
          <HomeButton onClick={handleMain} borderRadius="20%" border="2px solid" borderColor="black"></HomeButton>
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

