export interface BrandEntry {
  slug: string;
  name: string;
  url: string;
  productUrl?: string;
  category: BrandCategory;
}

export type BrandCategory =
  | "fashion"
  | "electronics"
  | "home"
  | "beauty"
  | "grocery"
  | "general"
  | "dtc"
  | "luxury"
  | "sports";

export const CATEGORY_LABELS: Record<BrandCategory, string> = {
  fashion: "Fashion",
  electronics: "Electronics",
  home: "Home & Furniture",
  beauty: "Beauty",
  grocery: "Grocery & Delivery",
  general: "General / Marketplace",
  dtc: "DTC",
  luxury: "Luxury",
  sports: "Sports & Outdoor",
};

export const CATEGORY_COLORS: Record<BrandCategory, { bg: string; text: string; border: string }> = {
  fashion: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
  electronics: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  home: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  beauty: { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200" },
  grocery: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  general: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" },
  dtc: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  luxury: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  sports: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
};

export const BRANDS: BrandEntry[] = [
  // Fashion (20)
  { slug: "nike", name: "Nike", url: "https://www.nike.com", category: "fashion" },
  { slug: "adidas", name: "Adidas", url: "https://www.adidas.com", category: "fashion" },
  { slug: "zara", name: "Zara", url: "https://www.zara.com", category: "fashion" },
  { slug: "hm", name: "H&M", url: "https://www.hm.com", category: "fashion" },
  { slug: "asos", name: "ASOS", url: "https://www.asos.com", category: "fashion" },
  { slug: "uniqlo", name: "Uniqlo", url: "https://www.uniqlo.com", category: "fashion" },
  { slug: "gap", name: "Gap", url: "https://www.gap.com", category: "fashion" },
  { slug: "nordstrom", name: "Nordstrom", url: "https://www.nordstrom.com", category: "fashion" },
  { slug: "lululemon", name: "lululemon", url: "https://www.lululemon.com", category: "fashion" },
  { slug: "shein", name: "SHEIN", url: "https://www.shein.com", category: "fashion" },
  { slug: "mango", name: "Mango", url: "https://www.mango.com", category: "fashion" },
  { slug: "jcrew", name: "J.Crew", url: "https://www.jcrew.com", category: "fashion" },
  { slug: "abercrombie", name: "Abercrombie", url: "https://www.abercrombie.com", category: "fashion" },
  { slug: "ralph-lauren", name: "Ralph Lauren", url: "https://www.ralphlauren.com", category: "fashion" },
  { slug: "tommy-hilfiger", name: "Tommy Hilfiger", url: "https://www.tommyhilfiger.com", category: "fashion" },
  { slug: "urban-outfitters", name: "Urban Outfitters", url: "https://www.urbanoutfitters.com", category: "fashion" },
  { slug: "forever-21", name: "Forever 21", url: "https://www.forever21.com", category: "fashion" },
  { slug: "old-navy", name: "Old Navy", url: "https://www.oldnavy.com", category: "fashion" },
  { slug: "banana-republic", name: "Banana Republic", url: "https://www.bananarepublic.com", category: "fashion" },
  { slug: "puma", name: "Puma", url: "https://www.puma.com", category: "fashion" },

  // Electronics (12)
  { slug: "apple", name: "Apple", url: "https://www.apple.com", category: "electronics" },
  { slug: "samsung", name: "Samsung", url: "https://www.samsung.com", category: "electronics" },
  { slug: "best-buy", name: "Best Buy", url: "https://www.bestbuy.com", category: "electronics" },
  { slug: "dell", name: "Dell", url: "https://www.dell.com", category: "electronics" },
  { slug: "hp", name: "HP", url: "https://www.hp.com", category: "electronics" },
  { slug: "lenovo", name: "Lenovo", url: "https://www.lenovo.com", category: "electronics" },
  { slug: "sony", name: "Sony", url: "https://www.sony.com", category: "electronics" },
  { slug: "bose", name: "Bose", url: "https://www.bose.com", category: "electronics" },
  { slug: "logitech", name: "Logitech", url: "https://www.logitech.com", category: "electronics" },
  { slug: "newegg", name: "Newegg", url: "https://www.newegg.com", category: "electronics" },
  { slug: "bh-photo", name: "B&H Photo", url: "https://www.bhphotovideo.com", category: "electronics" },
  { slug: "micro-center", name: "Micro Center", url: "https://www.microcenter.com", category: "electronics" },

  // Home (12)
  { slug: "ikea", name: "IKEA", url: "https://www.ikea.com", category: "home" },
  { slug: "wayfair", name: "Wayfair", url: "https://www.wayfair.com", category: "home" },
  { slug: "west-elm", name: "West Elm", url: "https://www.westelm.com", category: "home" },
  { slug: "pottery-barn", name: "Pottery Barn", url: "https://www.potterybarn.com", category: "home" },
  { slug: "cb2", name: "CB2", url: "https://www.cb2.com", category: "home" },
  { slug: "crate-barrel", name: "Crate & Barrel", url: "https://www.crateandbarrel.com", category: "home" },
  { slug: "rh", name: "RH", url: "https://www.rh.com", category: "home" },
  { slug: "williams-sonoma", name: "Williams Sonoma", url: "https://www.williams-sonoma.com", category: "home" },
  { slug: "home-depot", name: "Home Depot", url: "https://www.homedepot.com", category: "home" },
  { slug: "lowes", name: "Lowe's", url: "https://www.lowes.com", category: "home" },
  { slug: "overstock", name: "Overstock", url: "https://www.overstock.com", category: "home" },
  { slug: "article", name: "Article", url: "https://www.article.com", category: "home" },

  // Beauty (10)
  { slug: "sephora", name: "Sephora", url: "https://www.sephora.com", category: "beauty" },
  { slug: "ulta", name: "Ulta", url: "https://www.ulta.com", category: "beauty" },
  { slug: "glossier", name: "Glossier", url: "https://www.glossier.com", productUrl: "https://www.glossier.com/products/boy-brow", category: "beauty" },
  { slug: "fenty-beauty", name: "Fenty Beauty", url: "https://www.fentybeauty.com", category: "beauty" },
  { slug: "the-ordinary", name: "The Ordinary", url: "https://www.theordinary.com", category: "beauty" },
  { slug: "bath-body-works", name: "Bath & Body Works", url: "https://www.bathandbodyworks.com", category: "beauty" },
  { slug: "mac", name: "MAC", url: "https://www.maccosmetics.com", category: "beauty" },
  { slug: "clinique", name: "Clinique", url: "https://www.clinique.com", category: "beauty" },
  { slug: "kiehls", name: "Kiehl's", url: "https://www.kiehls.com", category: "beauty" },
  { slug: "drunk-elephant", name: "Drunk Elephant", url: "https://www.drunkelephant.com", category: "beauty" },

  // Grocery (8)
  { slug: "walmart-grocery", name: "Walmart Grocery", url: "https://www.walmart.com/grocery", category: "grocery" },
  { slug: "instacart", name: "Instacart", url: "https://www.instacart.com", category: "grocery" },
  { slug: "amazon-fresh", name: "Amazon Fresh", url: "https://www.amazon.com/fresh", category: "grocery" },
  { slug: "thrive-market", name: "Thrive Market", url: "https://www.thrivemarket.com", category: "grocery" },
  { slug: "kroger", name: "Kroger", url: "https://www.kroger.com", category: "grocery" },
  { slug: "whole-foods", name: "Whole Foods", url: "https://www.wholefoodsmarket.com", category: "grocery" },
  { slug: "gopuff", name: "Gopuff", url: "https://www.gopuff.com", category: "grocery" },
  { slug: "doordash", name: "DoorDash", url: "https://www.doordash.com", category: "grocery" },

  // General / Marketplace (10)
  { slug: "amazon", name: "Amazon", url: "https://www.amazon.com", category: "general" },
  { slug: "target", name: "Target", url: "https://www.target.com", category: "general" },
  { slug: "walmart", name: "Walmart", url: "https://www.walmart.com", category: "general" },
  { slug: "ebay", name: "eBay", url: "https://www.ebay.com", category: "general" },
  { slug: "etsy", name: "Etsy", url: "https://www.etsy.com", category: "general" },
  { slug: "costco", name: "Costco", url: "https://www.costco.com", category: "general" },
  { slug: "macys", name: "Macy's", url: "https://www.macys.com", category: "general" },
  { slug: "kohls", name: "Kohl's", url: "https://www.kohls.com", category: "general" },
  { slug: "tj-maxx", name: "TJ Maxx", url: "https://www.tjmaxx.com", category: "general" },
  { slug: "five-below", name: "Five Below", url: "https://www.fivebelow.com", category: "general" },

  // DTC (18)
  { slug: "allbirds", name: "Allbirds", url: "https://www.allbirds.com", productUrl: "https://www.allbirds.com/products/mens-tree-runners", category: "dtc" },
  { slug: "warby-parker", name: "Warby Parker", url: "https://www.warbyparker.com", category: "dtc" },
  { slug: "casper", name: "Casper", url: "https://www.casper.com", category: "dtc" },
  { slug: "everlane", name: "Everlane", url: "https://www.everlane.com", category: "dtc" },
  { slug: "bombas", name: "Bombas", url: "https://www.bombas.com", category: "dtc" },
  { slug: "rothys", name: "Rothy's", url: "https://www.rothys.com", category: "dtc" },
  { slug: "away", name: "Away", url: "https://www.awaytravel.com", category: "dtc" },
  { slug: "brooklinen", name: "Brooklinen", url: "https://www.brooklinen.com", category: "dtc" },
  { slug: "on-running", name: "On Running", url: "https://www.on.com", category: "dtc" },
  { slug: "hoka", name: "HOKA", url: "https://www.hoka.com", category: "dtc" },
  { slug: "vuori", name: "Vuori", url: "https://www.vuori.com", category: "dtc" },
  { slug: "skims", name: "SKIMS", url: "https://www.skims.com", category: "dtc" },
  { slug: "mejuri", name: "Mejuri", url: "https://www.mejuri.com", category: "dtc" },
  { slug: "native", name: "Native", url: "https://www.nativecos.com", category: "dtc" },
  { slug: "ritual", name: "Ritual", url: "https://www.ritual.com", category: "dtc" },
  { slug: "hims", name: "Hims", url: "https://www.forhims.com", category: "dtc" },
  { slug: "cuts", name: "Cuts", url: "https://www.cutsclothing.com", category: "dtc" },
  { slug: "gymshark", name: "Gymshark", url: "https://www.gymshark.com", category: "dtc" },

  // Luxury (6)
  { slug: "louis-vuitton", name: "Louis Vuitton", url: "https://www.louisvuitton.com", category: "luxury" },
  { slug: "gucci", name: "Gucci", url: "https://www.gucci.com", category: "luxury" },
  { slug: "hermes", name: "Hermès", url: "https://www.hermes.com", category: "luxury" },
  { slug: "burberry", name: "Burberry", url: "https://www.burberry.com", category: "luxury" },
  { slug: "tiffany", name: "Tiffany", url: "https://www.tiffany.com", category: "luxury" },
  { slug: "net-a-porter", name: "NET-A-PORTER", url: "https://www.net-a-porter.com", category: "luxury" },

  // Sports (4)
  { slug: "rei", name: "REI", url: "https://www.rei.com", category: "sports" },
  { slug: "patagonia", name: "Patagonia", url: "https://www.patagonia.com", category: "sports" },
  { slug: "north-face", name: "The North Face", url: "https://www.thenorthface.com", category: "sports" },
  { slug: "yeti", name: "YETI", url: "https://www.yeti.com", productUrl: "https://www.yeti.com/drinkware/bottles/rambler-26-oz-bottle.html", category: "sports" },
];
