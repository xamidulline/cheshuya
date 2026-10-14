"use client";

import { ResponsiveImage } from "@/components/responsive-image";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createImageGallery } from "@/lib/carousel-controller";
import { zineDetails } from "@/content/site-content";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type Zine = (typeof zineDetails)[keyof typeof zineDetails];

export function ZineDetailPage({ zine }: { zine: Zine }) {
  const [slide, setSlide] = useState(0);
  const [language, setLanguage] = useState("En");
  const hasManyImages = zine.images.length > 1;
  const stage = useRef<HTMLDivElement>(null);
  const gallery = useRef<ReturnType<typeof createImageGallery> | null>(null);
  useEffect(() => {
    if (!stage.current) return;
    const instance = createImageGallery(stage.current, setSlide);
    gallery.current = instance;
    return () => { instance.destroy(); gallery.current = null; };
  }, [zine.slug]);
  const move = (direction: -1 | 1) => gallery.current?.move(direction);
  return <main className="zine-page"><header className="zine-header"><div className="zine-return"><Button asChild variant="outline" size="icon" aria-label="Назад"><Link href="/catalog/prints"><ArrowLeft size={17}/></Link></Button></div><div className="zine-global-controls"><Button variant="outline" size="icon" onClick={() => setLanguage(language === "En" ? "Ru" : "En")}>{language}</Button><Sheet><SheetTrigger asChild><Button variant="outline" size="icon" aria-label="Открыть меню"><Menu size={18}/></Button></SheetTrigger><SheetContent><nav className="menu-list"><p>Работа в среде</p><Link href="/#outside">Уличное рисование</Link><Link href="/#zines">Печатные издания</Link><Link href="/#cyanotype">Цианотипия</Link><Link href="/#merch">Мерч</Link><p>Работа с материалом</p><Link href="/#inside">Поиск форм</Link><Link href="/#exhibitions">Выставки</Link><Link href="/#objects">Объекты</Link><Link href="/#drawings">Рисунки</Link></nav></SheetContent></Sheet></div></header><section className="zine-layout"><div className="zine-carousel" tabIndex={0} role="region" aria-label={`Фотографии: ${zine.title}`}><div className="zine-slide" ref={stage} key={zine.slug}>{zine.images.map((image, index) => <ResponsiveImage key={image} className="zine-photo" data-active={index === 0} aria-hidden={index !== 0} src={image} alt={`${zine.title}, изображение ${index + 1}`} sizes="(max-width: 700px) 100vw, 52vw" priority={index === 0} />)}</div>{hasManyImages && <div className="zine-controls"><Button variant="outline" size="icon" aria-label="Предыдущее изображение" onClick={() => move(-1)}><ChevronLeft size={17}/></Button><span>{slide + 1} / {zine.images.length}</span><Button variant="outline" size="icon" aria-label="Следующее изображение" onClick={() => move(1)}><ChevronRight size={17}/></Button></div>}</div><div className="zine-info"><p className="zine-meta">Зин · {zine.year}</p><h1>{zine.title}</h1>{zine.text ? <p>{zine.text}</p> : <p className="zine-placeholder">Описание и дополнительные развороты этого издания пока не добавлены в экспорт материалов.</p>}<nav className="zine-pagination" aria-label="Переход между зинами"><Button asChild variant="outline" size="icon" aria-label="Предыдущий зин"><Link href={`/zines/${zine.previous}`}><ChevronLeft size={17}/></Link></Button><Button asChild variant="outline" size="icon" aria-label="Следующий зин"><Link href={`/zines/${zine.next}`}><ChevronRight size={17}/></Link></Button></nav></div></section></main>;
}
