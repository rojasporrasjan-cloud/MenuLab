export { MarketingHeader } from './components/MarketingHeader'
export { MarketingFooter } from './components/MarketingFooter'
export { PathChooser } from './components/PathChooser'
export { FeatureShowcase } from './components/FeatureShowcase'
export { PricingTable } from './components/PricingTable'
export { TemplateGalleryCard } from './components/TemplateGalleryCard'
export { QuoteForm } from './components/QuoteForm'
export { Reveal } from './components/Reveal'
export { FoodMarquee } from './components/FoodMarquee'
export { HeroPhoneShowcase } from './components/HeroPhoneShowcase'
export { BentoFeatures } from './components/BentoFeatures'
export { ValueStack } from './components/ValueStack'

export { useSubmitQuote } from './hooks/useSubmitQuote'

export {
  ENTRY_PATHS,
  ENTRY_PATH,
  PLATFORM_FEATURES,
  PLANS,
} from './constants/marketing.content'
export type {
  EntryPath,
  EntryPathContent,
  FeatureContent,
  PlanContent,
} from './constants/marketing.content'

export {
  quoteSchema,
  QUOTE_SOURCE,
  MENU_SIZE_OPTIONS,
} from './types/quote.types'
export type { QuoteFormValues, QuoteSource, MenuSize, Quote } from './types/quote.types'
