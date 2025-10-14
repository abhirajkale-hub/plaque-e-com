export interface PropDiscount {
  id: string;
  firmName: string;
  logo: string;
  short: string;
  code: string;
  linkUrl: string;
  startDate: string;
  endDate: string;
  active: boolean;
  tags: string[];
  priority: number;
  notes: string;
}

export interface PropBanner {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  primaryCta: {
    label: string;
    href: string;
    target: string;
  };
  secondaryCta: {
    label: string;
    href: string;
    target: string;
  };
}

export interface PropDiscountsData {
  lastUpdated: string;
  filters: {
    tags: string[];
  };
  discounts: PropDiscount[];
}

export interface PropBannersData {
  slides: PropBanner[];
}

export const mockPropDiscounts: PropDiscountsData = {
  lastUpdated: "2025-10-03T06:00:00Z",
  filters: {
    tags: ["instant funding", "2-phase", "swing", "forex", "indices"]
  },
  discounts: [
    {
      id: "pf-001",
      firmName: "FundingPips",
      logo: "/placeholder.svg",
      short: "Flat 10% OFF on all challenges",
      code: "MINDEDTRADER10",
      linkUrl: "https://fundingpips.com/?ref=mindedtrader",
      startDate: "2025-10-01",
      endDate: "2025-10-31",
      active: true,
      tags: ["2-phase", "forex", "indices"],
      priority: 10,
      notes: "Auto-apply in October promo"
    },
    {
      id: "pf-002",
      firmName: "MyFundedFX",
      logo: "/placeholder.svg",
      short: "Sitewide 12% OFF + $0 fees",
      code: "MINDED12",
      linkUrl: "https://myfundedfx.com/?ref=mindedtrader",
      startDate: "2025-09-25",
      endDate: "2025-10-10",
      active: true,
      tags: ["instant funding", "forex"],
      priority: 8,
      notes: "Ends soon"
    },
    {
      id: "pf-003",
      firmName: "FundingTICs",
      logo: "/placeholder.svg",
      short: "Extra 8% OFF on 2-Step challenges",
      code: "AK8",
      linkUrl: "https://fundingtics.com/?ref=mindedtrader",
      startDate: "2025-10-03",
      endDate: "2025-12-31",
      active: true,
      tags: ["2-phase", "swing"],
      priority: 6,
      notes: "Q4 promo"
    },
    {
      id: "pf-004",
      firmName: "Old Prop (Expired demo)",
      logo: "/placeholder.svg",
      short: "5% OFF (expired)",
      code: "OLD5",
      linkUrl: "https://oldprop.com",
      startDate: "2025-08-01",
      endDate: "2025-08-31",
      active: true,
      tags: ["forex"],
      priority: 1,
      notes: "Should auto-hide (expired)"
    }
  ]
};

export const mockPropBanners: PropBannersData = {
  slides: [
    {
      id: "bn-001",
      image: "/placeholder.svg",
      title: "Claim Exclusive Prop Discounts",
      subtitle: "Save on challenges & instant funding today",
      primaryCta: { 
        label: "Buy Now", 
        href: "https://fundingpips.com/?ref=mindedtrader", 
        target: "_blank" 
      },
      secondaryCta: { 
        label: "Learn More", 
        href: "/prop-discounts#how-it-works", 
        target: "_self" 
      }
    },
    {
      id: "bn-002",
      image: "/placeholder.svg",
      title: "October Mega Offers",
      subtitle: "Limited-time coupons curated for traders",
      primaryCta: { 
        label: "Buy Now", 
        href: "https://myfundedfx.com/?ref=mindedtrader", 
        target: "_blank" 
      },
      secondaryCta: { 
        label: "Learn More", 
        href: "/prop-discounts#faq", 
        target: "_self" 
      }
    }
  ]
};
