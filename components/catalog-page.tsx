"use client";

import { ResponsiveImage } from "@/components/responsive-image";
import Link from "next/link";
import { ArrowLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export type CatalogItem = { title: string; year: string; image: string; slug?: string };
export function CatalogPage({ title, items }: { title: string; items: CatalogItem[] }) {
  return <main className={`catalog-page ${["Объекты", "Рисунки"].includes(title) ? "art-catalog" : ""}`}><header className="catalog-header"><Button asChild variant="outline" size="icon" aria-label="Назад"><Link href="/"><ArrowLeft size={17}/></Link></Button><div className="catalog-global-controls"><Sheet><SheetTrigger asChild><Button variant="outline" size="icon" aria-label="Открыть меню"><Menu size={18}/></Button></SheetTrigger><SheetContent><nav className="menu-list"><p>Работа в среде</p><Link href="/#outside">Уличное рисование</Link><Link href="/#zines">Печатные издания</Link><Link href="/#cyanotype">Цианотипия</Link><Link href="/#merch">Мерч</Link><p>Работа с материалом</p><Link href="/#inside">Поиск форм</Link><Link href="/#exhibitions">Выставки</Link><Link href="/#objects">Объекты</Link><Link href="/#drawings">Рисунки</Link></nav></SheetContent></Sheet></div></header><h1>{title}</h1><div className="catalog-grid">{items.map((item, index) => { const card = <Card className="catalog-card"><div className="catalog-image"><ResponsiveImage src={item.image} alt={item.title} fill sizes="(max-width: 620px) calc((100vw - 42px) / 2), (max-width: 1112px) calc((100vw - 72px) / 3), 347px" priority={index < 2} /></div><CardContent><strong>{item.title}</strong><span>{item.year}</span></CardContent></Card>; return item.slug ? <Link className="catalog-card-link" key={item.title} href={`/zines/${item.slug}`}>{card}</Link> : <div key={item.title}>{card}</div>; })}</div></main>;
}
