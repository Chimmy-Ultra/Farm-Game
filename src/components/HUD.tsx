import { useTranslation } from 'react-i18next';
import i18n from '../i18n/config';
import { useGameStore } from '../store/gameStore';

export function HUD() {
  const { t } = useTranslation();
  const { day, season, money, stamina, staminaMax, timeOfDay, language, setLanguage } =
    useGameStore();

  const hh = Math.floor(timeOfDay);
  const mm = Math.floor((timeOfDay - hh) * 60);
  const timeLabel = `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;

  const toggleLang = () => {
    const next = language === 'zh-TW' ? 'en' : 'zh-TW';
    setLanguage(next);
    void i18n.changeLanguage(next);
  };

  return (
    <>
      <div className="pointer-events-none absolute left-4 top-4 flex flex-col gap-2 text-neutral-100">
        <div className="text-xl font-semibold tracking-wide">
          {t('app.title')}
        </div>
        <div className="text-xs text-neutral-400">{t('app.subtitle')}</div>
        <div className="mt-3 flex gap-3 text-sm">
          <Chip label={t('hud.day', { day })} />
          <Chip label={`${t('hud.season')}：${t(`season.${season}`)}`} />
          <Chip label={timeLabel} />
        </div>
        <div className="flex gap-3 text-sm">
          <Chip label={`${t('hud.money')}  ${money}`} accent="gold" />
          <Chip
            label={`${t('hud.stamina')}  ${stamina}/${staminaMax}`}
            accent="green"
          />
        </div>
      </div>

      <button
        onClick={toggleLang}
        className="absolute right-4 top-4 rounded-md bg-neutral-800/70 px-3 py-1.5 text-xs font-medium text-neutral-100 ring-1 ring-neutral-700 transition hover:bg-neutral-700"
      >
        {language === 'zh-TW' ? 'EN' : '中'}
      </button>
    </>
  );
}

function Chip({
  label,
  accent,
}: {
  label: string;
  accent?: 'gold' | 'green';
}) {
  const color =
    accent === 'gold'
      ? 'bg-amber-900/50 ring-amber-700/50 text-amber-100'
      : accent === 'green'
        ? 'bg-emerald-900/40 ring-emerald-700/40 text-emerald-100'
        : 'bg-neutral-800/70 ring-neutral-700 text-neutral-100';
  return (
    <div className={`rounded-md px-2.5 py-1 ring-1 ${color}`}>{label}</div>
  );
}
