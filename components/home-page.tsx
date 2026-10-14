"use client";

import { ResponsiveImage } from "@/components/responsive-image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Instagram, Menu, Youtube } from "lucide-react";
import { useEffect, useState } from "react";
import { useCardCarousel } from "@/components/use-card-carousel";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cyanotypes, exhibitions, getCopy, graphics, type Locale, zines } from "@/content/site-content";

function Rail({ children, art = false }: { children: React.ReactNode; art?: boolean }) {
  const { rail, move } = useCardCarousel();
  return <div className={`rail ${art ? "rail-art" : ""}`}><div className="rail-scroll" ref={rail} tabIndex={0} aria-label="Галерея работ">{children}</div><Button className="rail-arrow rail-prev" variant="outline" size="icon" aria-label="Назад" onClick={() => move(-1)}><ChevronLeft size={17}/></Button><Button className="rail-arrow rail-next" variant="outline" size="icon" aria-label="Вперёд" onClick={() => move(1)}><ChevronRight size={17}/></Button></div>;
}

function Card({ image, title, note, href, merch = false }: { image: string; title: string; note: string; href?: string; merch?: boolean }) {
  const card = <article className="archive-card"><div className="archive-image"><ResponsiveImage src={image} alt={title} fill sizes={merch ? "(max-width: 672px) calc(100vw - 32px), 640px" : "235px"} /></div><div className="archive-caption"><strong>{title}</strong><span>{note}</span></div></article>;
  return href ? <Link className="archive-card-link" href={href}>{card}</Link> : card;
}

export function HomePage() {
  const [locale, setLocale] = useState<Locale>("ru");
  const [compact, setCompact] = useState(false);
  const [activeTab, setActiveTab] = useState("outside");
  const t = getCopy(locale);
  useEffect(() => { const onScroll = () => setCompact(window.scrollY > 95); onScroll(); window.addEventListener("scroll", onScroll, { passive: true }); return () => window.removeEventListener("scroll", onScroll); }, []);
  const scrollTo = (tab: string, id: string) => { setActiveTab(tab); window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 30); };
  const moveStreetImage = (event: React.PointerEvent<HTMLElement>) => { const rect = event.currentTarget.getBoundingClientRect(); const relativeX = (event.clientX - rect.left) / rect.width; const relativeY = (event.clientY - rect.top) / rect.height; event.currentTarget.style.setProperty("--street-x", `${(relativeX - .5) * 5}px`); event.currentTarget.style.setProperty("--street-y", `${(relativeY - .5) * 5}px`); event.currentTarget.style.setProperty("--halo-x", `${relativeX * 100}%`); event.currentTarget.style.setProperty("--halo-y", `${relativeY * 100}%`); };
  const resetStreetImage = (event: React.PointerEvent<HTMLElement>) => { event.currentTarget.style.setProperty("--street-x", "0px"); event.currentTarget.style.setProperty("--street-y", "0px"); };
  return <main className="archive-page">
    <header className={`archive-header ${compact ? "is-compact" : ""}`}>
      <Button className="header-logo" variant="ghost" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Наверх"><ResponsiveImage src="/media/logo.jpg" alt="Чешуя" width={112} height={112} sizes="37px" priority /></Button>
      <div className="header-controls"><Button className="language-button" variant="outline" size="icon" onClick={() => setLocale(locale === "ru" ? "en" : "ru")} aria-label="Сменить язык">{locale === "ru" ? "En" : "Ru"}</Button><Sheet><SheetTrigger asChild><Button variant="outline" size="icon" aria-label="Открыть меню"><Menu size={18}/></Button></SheetTrigger><SheetContent><nav className="menu-list"><p>{t.outside}</p><SheetClose asChild><Button variant="ghost" onClick={() => scrollTo("outside", "outside")}>Уличное рисование</Button></SheetClose><SheetClose asChild><Button variant="ghost" onClick={() => scrollTo("outside", "zines")}>Печатные издания</Button></SheetClose><SheetClose asChild><Button variant="ghost" onClick={() => scrollTo("outside", "cyanotype")}>Цианотипия</Button></SheetClose><SheetClose asChild><Button variant="ghost" onClick={() => scrollTo("outside", "merch")}>Мерч</Button></SheetClose><p>{t.inside}</p><SheetClose asChild><Button variant="ghost" onClick={() => scrollTo("inside", "inside")}>Поиск форм</Button></SheetClose><SheetClose asChild><Button variant="ghost" onClick={() => scrollTo("inside", "exhibitions")}>Выставки</Button></SheetClose><SheetClose asChild><Button variant="ghost" onClick={() => scrollTo("inside", "objects")}>Объекты</Button></SheetClose><SheetClose asChild><Button variant="ghost" onClick={() => scrollTo("inside", "drawings")}>Рисунки</Button></SheetClose></nav></SheetContent></Sheet></div>
    </header>
    <section className="logo-stage" onPointerMove={moveStreetImage} onPointerLeave={resetStreetImage}><ResponsiveImage src="/media/logo.jpg" alt="Чешуя" width={290} height={290} sizes="162px" priority /></section>
    <Tabs value={activeTab} onValueChange={setActiveTab} className="archive-shell" id="outside">
        <TabsList><TabsTrigger value="outside" onPointerDown={() => setActiveTab("outside")}>{t.outside.toLowerCase()}</TabsTrigger><TabsTrigger value="inside" onPointerDown={() => setActiveTab("inside")}>{t.inside.toLowerCase()}</TabsTrigger></TabsList>
      <TabsContent value="outside" className="tab-content">
        <section className="street-feature"><div className="feature-image"><ResponsiveImage src="/media/image%201.png" alt="Уличная работа Чешуи" fill sizes="(max-width: 640px) 100vw, 600px" priority /></div><h1>{t.streetTitle}</h1><p>{t.streetText}</p><div className="social-links"><a href="https://www.instagram.com/cheshu_ya/" target="_blank" rel="noreferrer"><Instagram size={15}/> Instagram</a><a href="https://www.youtube.com/@cheshu_ya" target="_blank" rel="noreferrer"><Youtube size={15}/> YouTube</a></div></section>
        <section className="archive-section" id="zines"><div className="section-heading"><h2>{t.zines}</h2><Link href="/catalog/prints">перейти</Link></div><Rail>{zines.map((zine) => <Card key={zine.title} image={zine.image} title={zine.title} note={zine.year} href={`/zines/${zine.slug}`} />)}</Rail></section>
        <section className="archive-section" id="cyanotype"><div className="section-heading"><h2>{t.cyanotype}</h2><span>{t.all}</span></div><p className="section-description">{t.cyanotypeText}</p><Rail art>{["/media/DSCF3126-Recovered_1.png", ...cyanotypes].map((image, i) => <article className="cyanotype-slide" key={image}><ResponsiveImage src={image} alt={`Цианотипия ${i + 1}`} fill sizes="(max-width: 640px) 100vw, 600px" /></article>)}</Rail></section>
        <section className="archive-section merch-section" id="merch"><div className="section-heading"><h2>{t.shirts}</h2></div><p className="section-description">Принт отсылает к уличной работе 2020 года, сделанной в Казани.</p><Card merch image="/media/image%202.png" title="Футболка «Дом»" note="Тиражная продукция" /></section>
      </TabsContent>
        <TabsContent value="inside" id="inside" className="tab-content inside-preview">
        <section className="archive-section" id="exhibitions"><div className="section-heading"><h2>{t.exhibitions}</h2><span>{t.all}</span></div><Rail>{exhibitions.map((item) => <Card key={item.title} image={item.image} title={item.title} note={item.year} />)}</Rail></section>
        <section className="archive-section" id="objects"><div className="section-heading"><h2>{t.objects}</h2><span>{t.all}</span></div><p className="section-description">Созданные артефакты — графика, скульптуры и следы взаимодействия с материалом.</p><Rail art>{[{image:"/media/1_(1).jpg", title:"Металл", note:"Серия рельефов «Водровь»"},{image:"/media/_DSF2252.jpg", title:"Керамика", note:"Коллекция керамики"},{image:"/media/_DSF2178.jpg", title:"Корни", note:"Объекты"}].map((item) => <Card key={item.title} {...item} />)}</Rail></section>
        <section className="archive-section" id="drawings"><div className="section-heading"><h2>Рисунки</h2><span>{t.all}</span></div><p className="section-description">Графика и живопись: серии работ на бумаге, холстах и дереве.</p><Rail>{graphics.map((image, index) => <Card key={image} image={image} title="Графика" note={index < 2 ? "2018–2020" : "Серия работ"} />)}</Rail></section>
      </TabsContent>
    </Tabs>
    <footer className="archive-footer"><a href="https://www.instagram.com/cheshu_ya/" target="_blank" rel="noreferrer">Instagram</a><a href="https://www.youtube.com/@cheshu_ya" target="_blank" rel="noreferrer">YouTube</a><a href="https://vk.com/public96023990" target="_blank" rel="noreferrer">VK</a></footer>
  </main>;
}
