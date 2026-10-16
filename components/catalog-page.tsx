"use client";

import { ResponsiveImage, getResponsiveImageSource } from "@/components/responsive-image";
import Link from "next/link";
import { useMemo } from "react";
import { usePhotoLightbox } from "@/components/use-photo-lightbox";
import { ArrowLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteMenu } from "@/components/site-menu";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";

export type CatalogItem = { title: string; year: string; image: string; slug?: string };
export function CatalogPage({ title, items }: { title: string; items: CatalogItem[] }) {
  const isArt = ["Объекты", "Рисунки"].includes(title);
  const photos = useMemo(() => items.map(item => ({ ...getResponsiveImageSource(item.image), alt: item.title })), [items]);
  const openPhoto = usePhotoLightbox(photos, title);
  return <main className={`catalog-page ${isArt ? "art-catalog" : ""}`}><header className="catalog-header"><Button asChild variant="outline" size="icon" aria-label="Назад"><Link href="/"><ArrowLeft size={17}/></Link></Button><div className="catalog-global-controls inner-header-controls"><Sheet><SheetTrigger asChild><Button variant="outline" size="icon" aria-label="Открыть меню"><Menu size={18}/></Button></SheetTrigger><SiteMenu /></Sheet></div></header><h1>{title}</h1><div className="catalog-grid">{items.map((item, index) => { const card = <Card className="catalog-card"><div className="catalog-image"><ResponsiveImage src={item.image} alt={item.title} fill sizes="(max-width: 620px) calc((100vw - 42px) / 2), (max-width: 1112px) calc((100vw - 72px) / 3), 347px" priority={index < 2} /></div><CardContent><strong>{item.title}</strong><span>{item.year}</span></CardContent></Card>; return item.slug ? <Link className="catalog-card-link" key={item.title} href={`/zines/${item.slug}`}>{card}</Link> : isArt ? <button type="button" className="artwork-trigger catalog-card-link" key={`${item.title}-${index}`} aria-label={`Открыть: ${item.title}, ${index + 1}`} onClick={event => openPhoto(index, event.currentTarget)}>{card}</button> : <div key={item.title}>{card}</div>; })}</div></main>;
}
