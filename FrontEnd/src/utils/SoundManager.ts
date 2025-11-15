// FrontEnd/src/utils/SoundManager.ts
type SoundName =
  | "Attack_fire"
  | "Attack_forest"
  | "Attack_electric"
  | "Attack_ice"
  | "Attack_poison"
  | "Attack_normal"
  | "Attack_land"
  | "Attack_esper"
  | "Attack_fly"
  | "Attack_water"
  | "Attack_legend"
  | "Attack_worm"
  | "heal"
  | "Cardpack_open"
  | "Hit_Normal_Damage"
  | "Hit_Super_Damage"
  | "Hit_Weak_Damage"
  | "Turn_change"
  | "Pack_opening"
  | "card_summon"
  | "victory"
  | "defeat";

class SoundManager {
  private static sounds: Partial<Record<SoundName, HTMLAudioElement>> = {};
  private static bgm: HTMLAudioElement | null = null; // 🎵 BGM 전용 Audio
  private static initialized = false;

  // 🔥 컷씬용 전역 오디오 시스템 추가
  private static audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  private static cutsceneGain = SoundManager.audioCtx.createGain();

  static init() {
    if (this.initialized) return;
    this.initialized = true;

    const base = `${window.location.origin}/assets/sounds`;

    const register = (name: SoundName, file: string) => {
      this.sounds[name] = new Audio(`${base}/${file}`);
      console.log(`🔊 [Sound Registered] ${name} → ${base}/${file}`);
    };

    // 공격 사운드 등록
    register("Attack_fire", "Attack_fire.wav");
    register("Attack_forest", "Attack_forest.wav");
    register("Attack_electric", "Attack_electric.wav");
    register("Attack_ice", "Attack_ice.wav");
    register("Attack_poison", "Attack_poison.wav");
    register("Attack_normal", "Attack_normal.wav");
    register("Attack_land", "Attack_land.wav");
    register("Attack_esper", "Attack_esper.wav");
    register("Attack_fly", "Attack_fly.wav");
    register("Attack_water", "Attack_water.wav");
    register("Attack_legend", "Attack_legend.wav");
    register("Attack_worm", "Attack_worm.wav");

    // 기타 사운드
    register("heal", "heal.wav");
    register("Cardpack_open", "Cardpack_open.wav");
    register("Pack_opening", "pack_opening.mp3");
    register("Turn_change", "Turn_change.wav");
    register("card_summon", "card_summon.wav");
    register("victory", "victory.mp3");
    register("defeat", "defeat.mp3");

    // 피격음
    register("Hit_Normal_Damage", "Hit_Normal_Damage.wav");
    register("Hit_Super_Damage", "Hit_Super_Damage.wav");
    register("Hit_Weak_Damage", "Hit_Weak_Damage.wav");

    this.cutsceneGain.gain.value = 30.0; // 기본 증폭
    this.cutsceneGain.connect(this.audioCtx.destination); // 🔥 이 줄 추가해야 완성!
  }

  // ------------------------------
  // 🔊 전역 BGM 정의
  // ------------------------------
  private static globalBGM: HTMLAudioElement | null = null;

  static playGlobalBGM() {
    const bgmPath = `${window.location.origin}/assets/sounds/bgm/global_theme.mp3`;

    if (!this.globalBGM) {
      this.globalBGM = new Audio(bgmPath);
      this.globalBGM.loop = true;
      this.globalBGM.volume = 0.4;
    }

    // iOS 자동재생 정책 우회
    this.globalBGM.play().catch(() => {});
  }

  static pauseGlobalBGM() {
    this.globalBGM?.pause();
  }

  static resumeGlobalBGM() {
    this.globalBGM?.play().catch(() => {});
  }

  // 배틀 BGM과 겹칠 때 완전히 멈추고 싶으면:
  static stopGlobalBGM() {
    if (this.globalBGM) {
      this.globalBGM.pause();
      this.globalBGM.currentTime = 0;
    }
  }

  static muteGlobalBGM() {
    if (this.globalBGM) this.globalBGM.muted = true;
  }

  static unmuteGlobalBGM() {
    if (this.globalBGM) this.globalBGM.muted = false;
  }

  // 💥 공통 재생 함수
  static play(name: SoundName, volume: number = 1) {
    const sound = this.sounds[name];
    if (!sound) {
      console.warn(`⚠️ [Sound Missing] '${name}'`);
      return;
    }

    console.log(`🎧 [Sound Play] name=${name}, volume=${volume}, path=${sound.src}`);

    sound.currentTime = 0;
    sound.volume = volume;
    sound.play().catch(() => {});
  }

  // 🔥 공격 사운드
  static playAttackByType(cardType: string) {
    const map: Record<string, SoundName> = {
      fire: "Attack_fire",
      forest: "Attack_forest",
      electric: "Attack_electric",
      ice: "Attack_ice",
      poison: "Attack_poison",
      normal: "Attack_normal",
      land: "Attack_land",
      esper: "Attack_esper",
      fly: "Attack_fly",
      water: "Attack_water",
      legend: "Attack_legend",
      worm: "Attack_worm",
    };

    const normalized = cardType?.toLowerCase() ?? "normal";
    const mapped = map[normalized] ?? "Attack_normal";

    console.log({
      category: "Attack Sound",
      cardTypeReceived: cardType,
      normalizedType: normalized,
      mappedSound: mapped,
      soundPath: this.sounds[mapped]?.src,
    });

    this.play(mapped, 0.9);
  }

  private static isGlobalMuted = false;

  static toggleGlobalMute() {
    this.isGlobalMuted = !this.isGlobalMuted;
    if (this.globalBGM) this.globalBGM.muted = this.isGlobalMuted;
    return this.isGlobalMuted;
  }

  // 💚 회복
  static playHeal() {
    this.play("heal", 0.9);
  }

  // 🎁 카드팩
  static playCardpackOpen() {
    this.play("Cardpack_open", 0.5);
  }

  static playTurnChange() {
    console.log(`🔄 [Sound: Turn Change]`);
    this.play("Turn_change", 0.9);
  }

  static playCutscene() {
    this.play("Pack_opening", 1.0); // 🔊 볼륨 크게 재생
  }

  static async playCutsceneLoud() {
    // 오디오 컨텍스트가 멈춰있으면 재개
    if (SoundManager.audioCtx.state === "suspended") {
      await SoundManager.audioCtx.resume();
    }

    const audio = new Audio("/assets/sounds/pack_opening.mp3");
    audio.crossOrigin = "anonymous";
    audio.volume = 1.0; // HTMLAudioElement 볼륨 최대로

    const track = SoundManager.audioCtx.createMediaElementSource(audio);
    track.connect(SoundManager.cutsceneGain);

    audio.play().catch(() => {});
  }

  // 💢 피격 사운드
  static playHit(kind: "normal" | "super" | "weak") {
    let soundName: SoundName;

    if (kind === "super") soundName = "Hit_Super_Damage";
    else if (kind === "weak") soundName = "Hit_Weak_Damage";
    else soundName = "Hit_Normal_Damage";

    console.log({
      category: "Hit Sound",
      damageType: kind,
      mappedSound: soundName,
      soundPath: this.sounds[soundName]?.src,
    });

    this.play(soundName, 0.9);
  }

  // ================================
  // 🎵 BGM 기능 추가된 부분
  // ================================

  // 🔊 BGM 시작
  static playBGM() {
    const bgmPath = `${window.location.origin}/assets/sounds/bgm/battle_theme.mp3`;

    // 이미 생성된 BGM이 없으면 생성
    if (!this.bgm) {
      this.bgm = new Audio(bgmPath);
      this.bgm.loop = true;
      this.bgm.volume = 0.3;
    }

    console.log(`🎵 [BGM Start] ${bgmPath}`);
    this.bgm.play().catch(() => {});
  }

  // 🔇 BGM 정지
  static stopBGM() {
    if (!this.bgm) return;
    console.log(`🛑 [BGM Stop]`);
    this.bgm.pause();
    this.bgm.currentTime = 0;
  }

  // 🔇 BGM 음소거 토글
  static toggleMuteBGM(): boolean {
    if (!this.bgm) return false; // 항상 boolean 반환
    this.bgm.muted = !this.bgm.muted;
    return this.bgm.muted;
  }
}

export default SoundManager;
