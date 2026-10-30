# Runbook

## Deployment Procedures

### Automatic Deployment (Recommended)

The site automatically deploys to GitHub Pages when changes are pushed to the `main` branch.

**Workflow:**
1. Push changes to `main`
2. GitHub Actions triggers `deploy.yml`
3. Build runs on `ubuntu-latest` with Node.js 22 and pnpm 10.30.0
4. Static files generated in `dist/` directory
5. `.nojekyll` file added for GitHub Pages
6. Artifact uploaded and deployed

**Monitor Deployment:**
- Go to repository → Actions tab
- Watch "Deploy to GitHub Pages" workflow
- Check deployment status in Environments → github-pages

### Manual Deployment

If automatic deployment fails:

1. **Check build locally**
   ```bash
   pnpm build
   pnpm preview
   ```

2. **Verify dist directory**
   ```bash
   ls -la dist/
   ```

3. **Manual trigger**
   - Go to Actions → Deploy to GitHub Pages
   - Click "Run workflow"
   - Select `main` branch

### Rollback Procedure

1. **Identify last good commit**
   ```bash
   git log --oneline
   ```

2. **Revert to previous version**
   ```bash
   git revert HEAD
   git push origin main
   ```

3. **Or reset to specific commit**
   ```bash
   git reset --hard <commit-hash>
   git push --force origin main
   ```
   > ⚠️ **Warning**: Force push rewrites history. Use with caution.

## Health Checks

### Site Accessibility

- **Production URL**: https://davidhlp.github.io
- **Check status**: Visit the URL and verify page loads
- **Check RSS feed**: https://davidhlp.github.io/feed.xml

### Build Health

```bash
# Local build test
pnpm build

# Type checking
pnpm check

# Linting
pnpm lint
```

### Content Validation

```bash
# Check for broken links (if tool available)
pnpm build 2>&1 | grep -i "error\|warning"
```

## Common Issues and Fixes

### Build Failures

#### Issue: TypeScript Errors
```
Error: Type 'X' is not assignable to type 'Y'
```

**Fix:**
1. Run `pnpm check` to see all type errors
2. Fix TypeScript issues in the reported files
3. Ensure content collection schemas match frontmatter

#### Issue: Missing Dependencies
```
Error: Cannot find module 'X'
```

**Fix:**
```bash
pnpm install
```

#### Issue: Content Collection Errors
```
Error: Invalid frontmatter in X
```

**Fix:**
1. Check the file's frontmatter against the schema in `src/content.config.ts`
2. Ensure required fields are present
3. Verify date format is correct

### Deployment Failures

#### Issue: GitHub Pages Not Updating

**Check:**
1. Verify workflow completed successfully
2. Check GitHub Pages settings (Settings → Pages)
3. Ensure source is set to "GitHub Actions"

**Fix:**
```bash
# Force rebuild
git commit --allow-empty -m "chore: force rebuild"
git push origin main
```

#### Issue: 404 Errors on Refresh

**Cause:** GitHub Pages doesn't support SPA routing

**Fix:** Already handled by Astro's static build. If issues persist:
1. Check `astro.config.ts` for `trailingSlash` setting
2. Verify all routes generate `index.html` files

### Content Issues

#### Issue: Images Not Loading

**Check:**
1. Image paths are relative to the markdown file
2. Images are in the `public/` directory or properly imported
3. File extensions are correct

**Fix:**
```markdown
<!-- Correct -->
![Alt text](./image.png)

<!-- For public directory images -->
![Alt text](/images/image.png)
```

#### Issue: i18n Content Not Showing

**Check:**
1. File is in the correct locale directory
2. Frontmatter includes required fields
3. File doesn't start with `_` (draft marker)

**Fix:**
- Ensure file is in `src/content/{collection}/{locale}/`
- Verify locale code matches (`en`, `zh-cn`, `ja`)

### Performance Issues

#### Issue: Slow Build Times

**Cause:** Large content collection or complex markdown processing

**Fix:**
1. Check for extremely large markdown files
2. Verify remark/rehype plugins are necessary
3. Consider splitting large content files

#### Issue: Slow Page Loads

**Check:**
1. Image sizes (should be optimized)
2. JavaScript bundle size
3. External resource loading

**Fix:**
```bash
# Build and check output
pnpm build
ls -lh dist/
```

## Monitoring and Alerts

### GitHub Actions Monitoring

- **Workflow failures**: Check Actions tab for red X marks
- **Build time trends**: Monitor workflow duration
- **Dependency updates**: Dependabot alerts

### Site Monitoring

- **Uptime**: Manual check or use external service
- **Performance**: Lighthouse scores
- **Content freshness**: Check RSS feed updates

## Escalation Paths

### For Build Issues

1. Check GitHub Actions logs
2. Review recent commits for breaking changes
3. Check Astro/Svelte documentation for updates
4. Open issue with error details

### For Content Issues

1. Verify frontmatter schema
2. Check markdown syntax
3. Test with minimal content
4. Open issue with content example

### For Deployment Issues

1. Check GitHub Pages status
2. Verify repository settings
3. Check DNS configuration (if custom domain)
4. Contact GitHub Support if needed

## Maintenance Tasks

### Regular Maintenance

- **Weekly**: Check for dependency updates
- **Monthly**: Review and update content
- **Quarterly**: Audit performance and accessibility

### Dependency Updates

```bash
# Check for updates
pnpm outdated

# Update dependencies
pnpm update

# Update specific package
pnpm update <package-name>
```

### Content Cleanup

1. Review draft content (`_*.md` files)
2. Update outdated information
3. Check for broken links
4. Verify image references

## Emergency Procedures

### Site Down

1. Check GitHub Pages status page
2. Verify DNS resolution
3. Check repository settings
4. Deploy from backup if needed

### Data Loss

1. Check git history for recoverable content
2. Restore from backup if available
3. Recreate content from local copies

### Security Issues

1. Rotate any exposed credentials
2. Review access logs
3. Update dependencies with security patches
4. Report to GitHub if platform issue
