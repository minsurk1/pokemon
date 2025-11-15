// FrontEnd/src/utils/detectTypeByName.ts

/**
 * 카드 이름을 기반으로 타입을 자동 추정합니다.
 * (백엔드와 동일하게 동작)
 */
// FrontEnd/src/utils/detectTypeByName.ts

/**
 * 카드에 cardType 값이 이미 있으면 그대로 사용.
 * (⚡ 공격 사운드 혼동 방지를 위해 가장 우선)
 */
export function detectTypeByName(name: string, originalType?: string): string {
  if (originalType && typeof originalType === "string") {
    return originalType.toLowerCase();
  }

  if (!name) return "normal";
  const lower = name.toLowerCase();

  // 🔥 불꽃 타입
  const fireList = ["파이리", "포니타", "부스터", "윈디", "초염몽", "리자몽", "레시라무", "불", "불꽃"];

  // 물 타입
  const waterList = ["꼬부기", "고라파덕", "샤미드", "라프라스", "갸라도스", "거북왕", "가이오가", "물"];

  // 전기 타입
  const electricList = ["플러쉬", "라이츄", "전룡", "자포코일", "볼트로스", "피카츄", "썬더", "전기"];

  // 숲/풀
  const forestList = ["이상해씨", "모다피", "리피아", "나시", "토대부기", "세레비", "숲", "풀"];

  // 얼음
  const iceList = ["꾸꾸리", "메꾸리", "빙큐보", "얼음귀신", "크레베이이스", "프리져", "얼음"];

  // 독
  const poisonList = ["아보", "니드리나", "독개굴", "펜드라", "독침붕", "무한다이노", "독"];

  // 땅
  const landList = ["톱치", "코코리", "히포포타스", "대코파스", "맘모꾸리", "한카리아스", "땅"];

  // 에스퍼
  const esperList = ["요가랑", "랄토스", "에브이", "고디모아젤", "가디안", "뮤", "뮤츠", "에스퍼"];

  // 비행
  const flyList = ["찌르꼬", "깨비참", "구구", "깨비드릴조", "무장조", "루기아", "비행"];

  // 벌레
  const wormList = ["과사삭벌레", "두루지벌레", "캐터피", "실쿤", "파라섹트", "핫삼", "벌레"];

  // 전설
  const legendList = ["디아루가", "펄기아", "기라티나", "제크로무", "큐레무", "레쿠쟈", "아르세우스", "전설"];

  const typeMap: Record<string, string[]> = {
    fire: fireList,
    water: waterList,
    electric: electricList,
    forest: forestList,
    ice: iceList,
    poison: poisonList,
    land: landList,
    esper: esperList,
    fly: flyList,
    worm: wormList,
    legend: legendList,
  };

  for (const [type, list] of Object.entries(typeMap)) {
    if (list.some((key) => lower.includes(key.toLowerCase()))) {
      return type;
    }
  }

  return "normal";
}
