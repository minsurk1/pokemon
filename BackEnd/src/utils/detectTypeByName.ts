// BackEnd/src/utils/detectTypeByName.ts

/**
 * 카드 이름을 기반으로 타입을 자동 추정합니다.
 * (DB에서 cardType이 누락된 경우 fallback으로 사용)
 */
export function detectTypeByName(name: string): string {
  if (!name) return "normal";

  const lower = name.toLowerCase();

  // ==================== 🔥 불꽃 타입 ====================
  const fireList = ["파이리", "포니타", "부스터", "윈디", "초염몽", "리자몽", "레시라무", "불", "불꽃", "fire"];

  // ==================== 💧 물 타입 ====================
  const waterList = ["꼬부기", "고라파덕", "샤미드", "라프라스", "갸라도스", "거북왕", "가이오가", "물", "water"];

  // ==================== ⚡ 전기 타입 ====================
  const electricList = ["플러쉬", "라이츄", "전룡", "자포코일", "볼트로스", "피카츄", "썬더", "번개", "electric"];

  // ==================== 🌿 숲 / 풀 타입 ====================
  const forestList = ["이상해씨", "모다피", "리피아", "나시", "토대부기", "이상해꽃", "세레비", "숲", "풀", "잎", "꽃", "forest"];

  // ==================== ❄️ 얼음 타입 ====================
  const iceList = ["꾸꾸리", "메꾸리", "빙큐보", "얼음귀신", "크레베이이스", "레지아이스", "프리져", "얼음", "ice"];

  // ==================== ☠️ 독 타입 ====================
  const poisonList = ["아보", "니드리나", "독개굴", "펜드라", "니드킹", "독침붕", "무한다이노", "독", "poison"];

  // ==================== 🪨 땅 타입 ====================
  const landList = ["톱치", "코코리", "히포포타스", "대코파스", "맘모꾸리", "한카리아스", "그란돈", "땅", "land"];

  // ==================== 🧠 에스퍼 타입 ====================
  const esperList = ["요가랑", "랄토스", "에브이", "고디모아젤", "가디안", "뮤", "뮤츠", "에스퍼", "esper"];

  // ==================== 🕊️ 비행 타입 ====================
  const flyList = ["찌르꼬", "깨비참", "구구", "깨비드릴조", "무장조", "토네로스", "루기아", "비행", "fly"];

  // ==================== ⭐ 전설 타입 ====================
  const legendList = ["디아루가", "펄기아", "기라티나", "제크로무", "큐레무", "레쿠쟈", "아르세우스", "전설", "legend"];

  // ==================== 🪷 맵핑 기반 자동 판별 ====================
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
    legend: legendList,
  };

  for (const [type, list] of Object.entries(typeMap)) {
    if (list.some((n) => lower.includes(n.toLowerCase()))) return type;
  }

  // ==================== 🔎 키워드 기반 보정 ====================
  if (lower.includes("fire") || lower.includes("flame") || lower.includes("burn")) return "fire";
  if (lower.includes("water") || lower.includes("aqua") || lower.includes("wave")) return "water";
  if (lower.includes("electric") || lower.includes("volt") || lower.includes("zap")) return "electric";
  if (lower.includes("forest") || lower.includes("grass") || lower.includes("leaf") || lower.includes("bug")) return "forest";
  if (lower.includes("ice") || lower.includes("snow") || lower.includes("freeze")) return "ice";
  if (lower.includes("poison") || lower.includes("toxic") || lower.includes("acid")) return "poison";
  if (lower.includes("ground") || lower.includes("rock") || lower.includes("earth")) return "land";
  if (lower.includes("psychic") || lower.includes("mind") || lower.includes("esper")) return "esper";
  if (lower.includes("fly") || lower.includes("bird") || lower.includes("wing")) return "fly";
  if (lower.includes("legend") || lower.includes("myth") || lower.includes("god")) return "legend";

  // ⚪ 기본값
  return "normal";
}
