

## Plan: Add Logo to Top-Left of Xiaojin Home

**Change**: Modify `src/pages/xiaojin/XiaojinHome.tsx` to add the existing `BrandLogo` component (which uses `logo-youjin-ai.png`) to the top-left corner of the page, above the centered brand text.

**Implementation**:
1. Import `BrandLogo` from `@/components/brand/BrandLogo`
2. Add a flex row before the brand text section with the logo aligned left, using size `md` or `lg`
3. Keep the centered "小劲AI · 与光同行" text as-is below

