/* @ds-bundle: {"format":4,"namespace":"CurrculatorDesignSystem_3f2207","components":[{"name":"Button","sourcePath":"components/buttons/Button.jsx"},{"name":"IconButton","sourcePath":"components/buttons/IconButton.jsx"},{"name":"TextLink","sourcePath":"components/buttons/TextLink.jsx"},{"name":"OptionChip","sourcePath":"components/forms/OptionChip.jsx"},{"name":"SearchInput","sourcePath":"components/forms/SearchInput.jsx"},{"name":"Footer","sourcePath":"components/navigation/Footer.jsx"},{"name":"GlobalNav","sourcePath":"components/navigation/GlobalNav.jsx"},{"name":"StickyBar","sourcePath":"components/navigation/StickyBar.jsx"},{"name":"SubNav","sourcePath":"components/navigation/SubNav.jsx"},{"name":"ProductTile","sourcePath":"components/surfaces/ProductTile.jsx"},{"name":"QuoteCard","sourcePath":"components/surfaces/QuoteCard.jsx"},{"name":"UtilityCard","sourcePath":"components/surfaces/UtilityCard.jsx"}],"sourceHashes":{"components/buttons/Button.jsx":"67d2ca077983","components/buttons/IconButton.jsx":"d8200e2a268a","components/buttons/TextLink.jsx":"01b48db2ae99","components/forms/OptionChip.jsx":"79234da924b4","components/forms/SearchInput.jsx":"389ee2be9424","components/navigation/Footer.jsx":"91b89ba19438","components/navigation/GlobalNav.jsx":"2eefc48d587a","components/navigation/StickyBar.jsx":"fa799aa35ae9","components/navigation/SubNav.jsx":"a50a241dc60d","components/surfaces/ProductTile.jsx":"7424b3ff6e8e","components/surfaces/QuoteCard.jsx":"18c93cb08574","components/surfaces/UtilityCard.jsx":"c17877592f1d","ui_kits/website/Converter.jsx":"cb59a4f2d29f","ui_kits/website/Currencies.jsx":"94496e47d7f0","ui_kits/website/Home.jsx":"e88b78a00f9a","ui_kits/website/Renders.jsx":"35b3c5a4a39d","ui_kits/website/data.js":"54133ff37d7d"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.CurrculatorDesignSystem_3f2207 = window.CurrculatorDesignSystem_3f2207 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/buttons/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const base = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  border: 'none',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  textDecoration: 'none',
  boxSizing: 'border-box'
};
const variants = {
  primary: {
    background: 'var(--color-primary)',
    color: 'var(--color-on-primary)',
    font: 'var(--type-body)',
    letterSpacing: 'var(--tracking-body)',
    borderRadius: 'var(--radius-pill)',
    padding: '11px 22px'
  },
  secondary: {
    background: 'transparent',
    color: 'var(--color-primary)',
    border: '1px solid var(--color-primary)',
    font: 'var(--type-body)',
    letterSpacing: 'var(--tracking-body)',
    borderRadius: 'var(--radius-pill)',
    padding: '11px 22px'
  },
  dark: {
    background: 'var(--color-ink)',
    color: 'var(--text-on-dark)',
    font: 'var(--type-button-utility)',
    letterSpacing: 'var(--tracking-button-utility)',
    borderRadius: 'var(--radius-sm)',
    padding: '8px 15px'
  },
  pearl: {
    background: 'var(--surface-pearl)',
    color: 'var(--color-ink-muted-80)',
    border: '3px solid var(--color-divider-soft)',
    font: 'var(--type-caption)',
    letterSpacing: 'var(--tracking-caption)',
    borderRadius: 'var(--radius-md)',
    padding: '8px 14px'
  },
  hero: {
    background: 'var(--color-primary)',
    color: 'var(--color-on-primary)',
    font: 'var(--type-button-large)',
    letterSpacing: 'var(--tracking-button-large)',
    borderRadius: 'var(--radius-pill)',
    padding: '14px 28px'
  }
};
function Button({
  variant = 'primary',
  onDark = false,
  disabled = false,
  href,
  onClick,
  children,
  style,
  type = 'button',
  ...rest
}) {
  let s = {
    ...base,
    ...(variants[variant] || variants.primary)
  };
  if (variant === 'secondary' && onDark) {
    s.color = 'var(--color-primary-on-dark)';
    s.borderColor = 'var(--color-primary-on-dark)';
  }
  if (disabled) {
    s = {
      ...s,
      cursor: 'default',
      color: 'var(--color-ink-muted-48)',
      background: variant === 'secondary' ? 'transparent' : 'var(--surface-parchment)',
      borderColor: 'var(--color-hairline)'
    };
  }
  const cls = disabled ? 'cc-focus' : 'cc-press cc-focus';
  const merged = {
    ...s,
    ...style
  };
  if (href && !disabled) return /*#__PURE__*/React.createElement("a", _extends({
    href: href,
    onClick: onClick,
    className: cls,
    style: merged
  }, rest), children);
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onClick: onClick,
    className: cls,
    style: merged
  }, rest), children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/Button.jsx", error: String((e && e.message) || e) }); }

// components/buttons/IconButton.jsx
try { (() => {
function IconButton({
  icon,
  label,
  onClick,
  size = 44,
  style
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": label,
    title: label,
    onClick: onClick,
    className: "cc-press cc-focus",
    style: {
      width: size,
      height: size,
      borderRadius: 'var(--radius-full)',
      background: 'var(--surface-chip-translucent)',
      color: 'var(--color-ink)',
      border: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      padding: 0,
      backdropFilter: 'var(--blur-frosted)',
      WebkitBackdropFilter: 'var(--blur-frosted)',
      ...style
    }
  }, typeof icon === 'string' ? /*#__PURE__*/React.createElement("img", {
    src: icon,
    alt: "",
    width: 18,
    height: 18,
    style: {
      display: 'block'
    }
  }) : icon);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/buttons/TextLink.jsx
try { (() => {
function TextLink({
  href = '#',
  onDark = false,
  underline = false,
  onClick,
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("a", {
    href: href,
    onClick: onClick,
    className: "cc-focus",
    style: {
      color: onDark ? 'var(--text-link-on-dark)' : 'var(--text-link)',
      textDecoration: underline ? 'underline' : 'none',
      font: 'inherit',
      letterSpacing: 'inherit',
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { TextLink });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/TextLink.jsx", error: String((e && e.message) || e) }); }

// components/forms/OptionChip.jsx
try { (() => {
function OptionChip({
  label,
  detail,
  thumb,
  selected = false,
  onClick,
  style
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-pressed": selected,
    onClick: onClick,
    className: "cc-press cc-focus",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      width: '100%',
      textAlign: 'left',
      cursor: 'pointer',
      background: 'var(--surface-canvas)',
      color: 'var(--text-primary)',
      borderRadius: 'var(--radius-pill)',
      border: selected ? '2px solid var(--color-primary-focus)' : '1px solid var(--color-hairline)',
      padding: selected ? '11px 15px' : '12px 16px',
      font: 'var(--type-caption)',
      letterSpacing: 'var(--tracking-caption)',
      minHeight: 44,
      ...style
    }
  }, thumb && /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0,
      display: 'flex'
    }
  }, thumb), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      font: 'var(--type-caption-strong)',
      letterSpacing: 'var(--tracking-caption-strong)'
    }
  }, label), detail && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-secondary)',
      whiteSpace: 'nowrap'
    }
  }, detail));
}
Object.assign(__ds_scope, { OptionChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/OptionChip.jsx", error: String((e && e.message) || e) }); }

// components/forms/SearchInput.jsx
try { (() => {
function SearchInput({
  value,
  onChange,
  placeholder = 'Search',
  style
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      height: 44,
      padding: '12px 20px',
      background: 'var(--surface-canvas)',
      border: 'var(--border-soft)',
      borderRadius: 'var(--radius-pill)',
      boxSizing: 'border-box',
      ...style
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "https://unpkg.com/lucide-static@0.469.0/icons/search.svg",
    alt: "",
    width: 14,
    height: 14,
    style: {
      opacity: 0.5,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("input", {
    value: value,
    onChange: e => onChange && onChange(e.target.value),
    placeholder: placeholder,
    style: {
      flex: 1,
      minWidth: 0,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      font: 'var(--type-body)',
      letterSpacing: 'var(--tracking-body)',
      color: 'var(--text-primary)',
      padding: 0
    }
  }));
}
Object.assign(__ds_scope, { SearchInput });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SearchInput.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Footer.jsx
try { (() => {
function Footer({
  columns = [],
  note,
  legal,
  links = []
}) {
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: 'var(--surface-parchment)',
      color: 'var(--text-secondary)',
      padding: '64px 22px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 980,
      margin: '0 auto'
    }
  }, note && /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--type-fine-print)',
      letterSpacing: 'var(--tracking-fine-print)',
      lineHeight: 1.4,
      color: 'var(--text-tertiary)',
      margin: '0 0 24px',
      paddingBottom: 24,
      borderBottom: '1px solid var(--color-hairline)'
    }
  }, note), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))',
      gap: 24
    }
  }, columns.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.heading
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-caption-strong)',
      letterSpacing: 'var(--tracking-caption-strong)',
      color: 'var(--text-primary)',
      marginBottom: 4
    }
  }, c.heading), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: 'none',
      margin: 0,
      padding: 0
    }
  }, c.links.map(l => /*#__PURE__*/React.createElement("li", {
    key: l,
    style: {
      font: 'var(--type-dense-link)'
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    className: "cc-focus",
    style: {
      color: 'var(--text-secondary)',
      textDecoration: 'none'
    }
  }, l))))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 32,
      paddingTop: 16,
      borderTop: '1px solid var(--color-hairline)',
      display: 'flex',
      flexWrap: 'wrap',
      gap: 16,
      justifyContent: 'space-between',
      font: 'var(--type-fine-print)',
      letterSpacing: 'var(--tracking-fine-print)',
      color: 'var(--text-tertiary)'
    }
  }, /*#__PURE__*/React.createElement("span", null, legal), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      gap: 16,
      flexWrap: 'wrap'
    }
  }, links.map(l => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: "#",
    style: {
      color: 'var(--text-secondary)'
    }
  }, l))))));
}
Object.assign(__ds_scope, { Footer });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Footer.jsx", error: String((e && e.message) || e) }); }

// components/navigation/GlobalNav.jsx
try { (() => {
const ICON = 'https://unpkg.com/lucide-static@0.469.0/icons/';
const iconImg = n => /*#__PURE__*/React.createElement("img", {
  src: ICON + n + '.svg',
  alt: "",
  width: 15,
  height: 15,
  style: {
    display: 'block',
    filter: 'invert(1)',
    opacity: 0.8
  }
});
const btn = {
  background: 'none',
  border: 'none',
  padding: 8,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center'
};
function GlobalNav({
  brand = 'Currculator',
  links = [],
  active,
  onNavigate,
  onSearch,
  onAccount,
  onBrand
}) {
  const go = l => e => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(l);
    }
  };
  return /*#__PURE__*/React.createElement("nav", {
    style: {
      background: 'var(--surface-black)',
      height: 'var(--nav-height)',
      color: 'var(--text-on-dark)',
      position: 'relative',
      zIndex: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1024,
      margin: '0 auto',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 20,
      padding: '0 22px'
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      if (onBrand) {
        e.preventDefault();
        onBrand();
      }
    },
    className: "cc-focus",
    style: {
      color: 'var(--text-on-dark)',
      font: 'var(--type-caption-strong)',
      letterSpacing: 'var(--tracking-caption-strong)',
      textDecoration: 'none',
      whiteSpace: 'nowrap'
    }
  }, brand), /*#__PURE__*/React.createElement("div", {
    className: "cc-gnav-links",
    style: {
      flex: 1,
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 20,
      padding: '0 12px'
    }
  }, links.map(l => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: "#",
    onClick: go(l),
    className: "cc-focus",
    style: {
      color: 'var(--text-on-dark)',
      opacity: active === l ? 1 : 0.8,
      font: 'var(--type-nav-link)',
      letterSpacing: 'var(--tracking-nav-link)',
      textDecoration: 'none',
      whiteSpace: 'nowrap'
    }
  }, l))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      marginLeft: 'auto'
    }
  }, /*#__PURE__*/React.createElement("button", {
    "aria-label": "Search",
    onClick: onSearch,
    className: "cc-focus",
    style: btn
  }, iconImg('search')), /*#__PURE__*/React.createElement("button", {
    "aria-label": "Account",
    onClick: onAccount,
    className: "cc-focus",
    style: btn
  }, iconImg('user')), /*#__PURE__*/React.createElement("button", {
    "aria-label": "Menu",
    className: "cc-gnav-burger cc-focus",
    style: btn
  }, iconImg('menu')))));
}
Object.assign(__ds_scope, { GlobalNav });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/GlobalNav.jsx", error: String((e && e.message) || e) }); }

// components/navigation/StickyBar.jsx
try { (() => {
function StickyBar({
  label,
  value,
  cta = 'Continue',
  onCta,
  fixed = true
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: fixed ? 'fixed' : 'relative',
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 30,
      height: 'var(--stickybar-height)',
      background: 'var(--surface-frosted)',
      backdropFilter: 'var(--blur-frosted)',
      WebkitBackdropFilter: 'var(--blur-frosted)',
      borderTop: 'var(--border-soft)',
      padding: '12px 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-body)',
      letterSpacing: 'var(--tracking-body)',
      color: 'var(--text-primary)',
      minWidth: 0
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-secondary)'
    }
  }, label, " "), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-body-strong)'
    }
  }, value)), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    onClick: onCta
  }, cta));
}
Object.assign(__ds_scope, { StickyBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/StickyBar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/SubNav.jsx
try { (() => {
function SubNav({
  title,
  links = [],
  active,
  onNavigate,
  cta,
  onCta,
  sticky = true
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: sticky ? 'sticky' : 'relative',
      top: 0,
      zIndex: 15,
      height: 'var(--subnav-height)',
      background: 'var(--surface-frosted)',
      backdropFilter: 'var(--blur-frosted)',
      WebkitBackdropFilter: 'var(--blur-frosted)',
      borderBottom: 'var(--border-soft)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1024,
      margin: '0 auto',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 24,
      padding: '0 22px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-tagline)',
      letterSpacing: 'var(--tracking-tagline)',
      color: 'var(--text-primary)',
      whiteSpace: 'nowrap'
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    className: "cc-subnav-links",
    style: {
      display: 'flex',
      gap: 24,
      marginLeft: 'auto',
      alignItems: 'center'
    }
  }, links.map(l => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: "#",
    onClick: e => {
      if (onNavigate) {
        e.preventDefault();
        onNavigate(l);
      }
    },
    className: "cc-focus",
    style: {
      font: 'var(--type-caption)',
      letterSpacing: 'var(--tracking-caption)',
      color: active === l ? 'var(--text-tertiary)' : 'var(--text-primary)',
      textDecoration: 'none',
      whiteSpace: 'nowrap'
    }
  }, l))), cta && /*#__PURE__*/React.createElement(__ds_scope.Button, {
    onClick: onCta,
    style: {
      marginLeft: links.length ? 0 : 'auto',
      font: 'var(--type-caption)',
      letterSpacing: 'var(--tracking-caption)',
      padding: '4px 11px'
    }
  }, cta)));
}
Object.assign(__ds_scope, { SubNav });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/SubNav.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/ProductTile.jsx
try { (() => {
const tones = {
  light: {
    bg: 'var(--surface-canvas)',
    fg: 'var(--text-primary)',
    sub: 'var(--text-primary)'
  },
  parchment: {
    bg: 'var(--surface-parchment)',
    fg: 'var(--text-primary)',
    sub: 'var(--text-primary)'
  },
  dark: {
    bg: 'var(--surface-tile-1)',
    fg: 'var(--text-on-dark)',
    sub: 'var(--text-on-dark)'
  },
  'dark-2': {
    bg: 'var(--surface-tile-2)',
    fg: 'var(--text-on-dark)',
    sub: 'var(--text-on-dark)'
  },
  'dark-3': {
    bg: 'var(--surface-tile-3)',
    fg: 'var(--text-on-dark)',
    sub: 'var(--text-on-dark)'
  },
  black: {
    bg: 'var(--surface-black)',
    fg: 'var(--text-on-dark)',
    sub: 'var(--text-on-dark)'
  }
};
function ProductTile({
  tone = 'light',
  hero = false,
  eyebrow,
  title,
  tagline,
  actions,
  children,
  minHeight,
  style
}) {
  const t = tones[tone] || tones.light;
  return /*#__PURE__*/React.createElement("section", {
    className: "cc-tile",
    style: {
      background: t.bg,
      color: t.fg,
      borderRadius: 0,
      textAlign: 'center',
      overflow: 'hidden',
      minHeight,
      paddingInline: 22,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 980,
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }
  }, eyebrow && /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-tagline)',
      letterSpacing: 'var(--tracking-tagline)',
      marginBottom: 6
    }
  }, eyebrow), title && /*#__PURE__*/React.createElement("h2", {
    className: hero ? 'cc-type-hero-display' : 'cc-type-display-lg',
    style: {
      margin: 0,
      textWrap: 'balance'
    }
  }, title), tagline && /*#__PURE__*/React.createElement("p", {
    className: "cc-type-lead",
    style: {
      margin: '6px 0 0',
      color: t.sub,
      textWrap: 'pretty'
    }
  }, tagline), actions && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginTop: 20
    }
  }, actions), children && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 48,
      width: '100%',
      display: 'flex',
      justifyContent: 'center'
    }
  }, children)));
}
Object.assign(__ds_scope, { ProductTile });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/ProductTile.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/QuoteCard.jsx
try { (() => {
function QuoteCard({
  image,
  eyebrow,
  headline,
  cta,
  onCta,
  minHeight = 560
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      position: 'relative',
      minHeight,
      background: 'var(--surface-tile-1)',
      color: 'var(--text-on-dark)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: 'var(--space-section) 22px',
      overflow: 'hidden'
    }
  }, image && /*#__PURE__*/React.createElement("img", {
    src: image,
    alt: "",
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      maxWidth: 760,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 16
    }
  }, eyebrow && /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-caption-strong)',
      letterSpacing: 'var(--tracking-caption-strong)',
      color: 'var(--text-on-dark)'
    }
  }, eyebrow), /*#__PURE__*/React.createElement("h2", {
    className: "cc-type-display-lg",
    style: {
      margin: 0,
      textWrap: 'balance'
    }
  }, headline), cta && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Button, {
    onClick: onCta
  }, cta))));
}
Object.assign(__ds_scope, { QuoteCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/QuoteCard.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/UtilityCard.jsx
try { (() => {
function UtilityCard({
  media,
  name,
  detail,
  price,
  linkLabel,
  onLink,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-card)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-lg)',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      minWidth: 0,
      ...style
    }
  }, media && /*#__PURE__*/React.createElement("div", {
    style: {
      aspectRatio: '1 / 1',
      borderRadius: 'var(--radius-sm)',
      background: 'var(--surface-parchment)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      marginBottom: 16
    }
  }, media), name && /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-body-strong)',
      letterSpacing: 'var(--tracking-body-strong)',
      color: 'var(--text-primary)'
    }
  }, name), detail && /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-caption)',
      letterSpacing: 'var(--tracking-caption)',
      color: 'var(--text-secondary)'
    }
  }, detail), price && /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-body)',
      letterSpacing: 'var(--tracking-body)',
      color: 'var(--text-primary)'
    }
  }, price), linkLabel && /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      if (onLink) {
        e.preventDefault();
        onLink();
      }
    },
    className: "cc-focus",
    style: {
      font: 'var(--type-body)',
      letterSpacing: 'var(--tracking-body)',
      color: 'var(--text-link)',
      marginTop: 8,
      alignSelf: 'flex-start'
    }
  }, linkLabel));
}
Object.assign(__ds_scope, { UtilityCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/UtilityCard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Converter.jsx
try { (() => {
const {
  OptionChip,
  IconButton,
  StickyBar
} = window.CurrculatorDesignSystem_3f2207;
function Converter({
  from,
  to,
  setFrom,
  setTo
}) {
  const D = window.CC_DATA;
  const [amt, setAmt] = React.useState('1250');
  const n = parseFloat(amt.replace(/,/g, '')) || 0;
  const out = D.convert(n, from, to);
  const codes = Object.keys(D.rates);
  const picker = (label, val, set) => /*#__PURE__*/React.createElement("section", {
    style: {
      marginTop: 48
    }
  }, /*#__PURE__*/React.createElement("h3", {
    className: "cc-type-tagline",
    style: {
      margin: '0 0 16px'
    }
  }, label, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-tertiary)'
    }
  }, D.names[val][0])), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))',
      gap: 12
    }
  }, codes.map(c => /*#__PURE__*/React.createElement(OptionChip, {
    key: c,
    label: c,
    detail: D.names[c][1],
    selected: c === val,
    onClick: () => set(c)
  }))));
  return /*#__PURE__*/React.createElement("main", {
    style: {
      background: 'var(--surface-canvas)',
      padding: '64px 22px 140px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 980,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    className: "cc-type-hero-display",
    style: {
      margin: 0
    }
  }, "Convert."), /*#__PURE__*/React.createElement("p", {
    className: "cc-type-lead",
    style: {
      margin: '8px 0 0',
      color: 'var(--text-secondary)'
    }
  }, "Mid-market rate, updated every minute."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 48,
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1fr) auto minmax(0,1fr)',
      gap: 24,
      alignItems: 'center',
      background: 'var(--surface-parchment)',
      borderRadius: 'var(--radius-lg)',
      padding: 32
    }
  }, /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("div", {
    className: "cc-type-caption-strong",
    style: {
      color: 'var(--text-secondary)'
    }
  }, from), /*#__PURE__*/React.createElement("input", {
    value: amt,
    onChange: e => setAmt(e.target.value),
    inputMode: "decimal",
    style: {
      width: '100%',
      border: 'none',
      background: 'transparent',
      outline: 'none',
      font: '600 56px/1.07 var(--font-display)',
      letterSpacing: '-0.28px',
      color: 'var(--text-primary)',
      padding: 0
    }
  })), /*#__PURE__*/React.createElement(IconButton, {
    label: "Swap",
    icon: "https://unpkg.com/lucide-static@0.469.0/icons/arrow-left-right.svg",
    onClick: () => {
      setFrom(to);
      setTo(from);
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right',
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "cc-type-caption-strong",
    style: {
      color: 'var(--text-secondary)'
    }
  }, to), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '600 56px/1.07 var(--font-display)',
      letterSpacing: '-0.28px',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, D.fmt(out, to)))), /*#__PURE__*/React.createElement("p", {
    className: "cc-type-caption",
    style: {
      color: 'var(--text-tertiary)',
      margin: '12px 0 0'
    }
  }, "1 ", from, " = ", D.fmt(D.convert(1, from, to), to), " ", to), picker('From', from, setFrom), picker('To', to, setTo)), /*#__PURE__*/React.createElement(StickyBar, {
    label: D.fmt(n, from) + ' ' + from + ' =',
    value: D.fmt(out, to) + ' ' + to,
    cta: "Save conversion"
  }));
}
window.Converter = Converter;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Converter.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Currencies.jsx
try { (() => {
const {
  SearchInput,
  UtilityCard
} = window.CurrculatorDesignSystem_3f2207;
function Currencies({
  onConvert
}) {
  const D = window.CC_DATA;
  const [q, setQ] = React.useState('');
  const list = Object.keys(D.rates).filter(c => c !== 'USD' && (c + D.names[c][0]).toLowerCase().includes(q.toLowerCase()));
  return /*#__PURE__*/React.createElement("main", {
    style: {
      background: 'var(--surface-parchment)',
      padding: '64px 22px 80px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1440,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    className: "cc-type-hero-display",
    style: {
      margin: 0,
      textAlign: 'center'
    }
  }, "Currencies."), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 560,
      margin: '32px auto 48px'
    }
  }, /*#__PURE__*/React.createElement(SearchInput, {
    value: q,
    onChange: setQ,
    placeholder: "Search currencies"
  })), /*#__PURE__*/React.createElement("div", {
    className: "cc-grid-utility"
  }, list.map(c => /*#__PURE__*/React.createElement(UtilityCard, {
    key: c,
    media: /*#__PURE__*/React.createElement("span", {
      className: "cc-type-hero-display"
    }, D.names[c][1]),
    name: D.names[c][0],
    detail: c,
    price: '1 USD = ' + D.fmt(D.convert(1, 'USD', c), c),
    linkLabel: "Convert",
    onLink: () => onConvert(c)
  }))), !list.length && /*#__PURE__*/React.createElement("p", {
    className: "cc-type-body",
    style: {
      textAlign: 'center',
      color: 'var(--text-secondary)'
    }
  }, "No currencies match \u201C", q, "\u201D.")));
}
window.Currencies = Currencies;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Currencies.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Home.jsx
try { (() => {
const {
  ProductTile,
  Button,
  QuoteCard,
  TextLink
} = window.CurrculatorDesignSystem_3f2207;
function Home({
  go
}) {
  return /*#__PURE__*/React.createElement("main", null, /*#__PURE__*/React.createElement(ProductTile, {
    tone: "light",
    hero: true,
    title: "Convert anything.",
    tagline: "Every currency. One quiet calculator.",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      onClick: () => go('Convert')
    }, "Open converter"), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      onClick: () => go('Currencies')
    }, "Browse currencies"))
  }, /*#__PURE__*/React.createElement(ConverterRender, null)), /*#__PURE__*/React.createElement(ProductTile, {
    tone: "dark",
    eyebrow: "Currculator Pro",
    title: "Live rates. Even offline.",
    tagline: "Rates cache on your device every hour.",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      onClick: () => go('Pro')
    }, "Upgrade"), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      onDark: true
    }, "Learn more"))
  }, /*#__PURE__*/React.createElement(ConverterRender, {
    from: "USD",
    to: "JPY",
    amount: 480
  })), /*#__PURE__*/React.createElement("div", {
    className: "cc-tile-pair",
    style: {
      padding: 12,
      background: 'var(--surface-canvas)'
    }
  }, /*#__PURE__*/React.createElement(ProductTile, {
    tone: "parchment",
    title: "Widgets",
    tagline: "Your pairs, on your home screen.",
    actions: /*#__PURE__*/React.createElement(Button, null, "Learn more")
  }, /*#__PURE__*/React.createElement(WidgetRender, null)), /*#__PURE__*/React.createElement(ProductTile, {
    tone: "dark-2",
    title: "Rate history",
    tagline: "Ten years, every pair.",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, null, "Learn more"))
  }, /*#__PURE__*/React.createElement("p", {
    className: "cc-type-body",
    style: {
      margin: 0,
      color: 'var(--text-muted-on-dark)',
      maxWidth: 320
    }
  }, "Compare today against any date since 2016. ", /*#__PURE__*/React.createElement(TextLink, {
    onDark: true,
    href: "#"
  }, "See how it works")))), /*#__PURE__*/React.createElement(QuoteCard, {
    eyebrow: "Our data",
    headline: "Mid-market rates from 40 sources. No markup, ever.",
    cta: "How we source rates"
  }));
}
window.Home = Home;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Home.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Renders.jsx
try { (() => {
function ConverterRender({
  from = 'EUR',
  to = 'USD',
  amount = 1250
}) {
  const D = window.CC_DATA;
  const out = D.convert(amount, from, to);
  const row = (c, v, big) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      padding: '16px 0',
      borderBottom: '1px solid var(--color-hairline)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-caption-strong)',
      letterSpacing: 'var(--tracking-caption-strong)'
    }
  }, c), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-fine-print)',
      color: 'var(--text-tertiary)',
      marginTop: 4
    }
  }, D.names[c][0])), /*#__PURE__*/React.createElement("div", {
    style: {
      font: big ? '600 34px/1.1 var(--font-display)' : '400 28px/1.14 var(--font-display)',
      letterSpacing: big ? '-0.374px' : '0.196px'
    }
  }, D.names[c][1], D.fmt(v, c)));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: 320,
      background: 'var(--surface-canvas)',
      color: 'var(--text-primary)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-product)',
      padding: '24px 24px 20px',
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-fine-print)',
      color: 'var(--text-tertiary)',
      letterSpacing: 'var(--tracking-fine-print)'
    }
  }, "Mid-market \xB7 updated 1 min ago"), row(from, amount, false), row(to, out, true), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 8,
      marginTop: 16
    }
  }, ['7', '8', '9', '4', '5', '6', '1', '2', '3'].map(k => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      height: 40,
      borderRadius: 'var(--radius-sm)',
      background: 'var(--surface-parchment)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      font: 'var(--type-body)'
    }
  }, k))));
}
function WidgetRender({
  pairs = [['EUR', 'USD'], ['GBP', 'USD'], ['USD', 'JPY']]
}) {
  const D = window.CC_DATA;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: 300,
      background: 'var(--surface-canvas)',
      color: 'var(--text-primary)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-product)',
      padding: 20,
      textAlign: 'left'
    }
  }, pairs.map(([a, b], i) => /*#__PURE__*/React.createElement("div", {
    key: a + b,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '10px 0',
      borderTop: i ? '1px solid var(--color-hairline)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-caption-strong)'
    }
  }, a, " \u2192 ", b), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-caption)'
    }
  }, D.fmt(D.convert(1, a, b), b)))));
}
Object.assign(window, {
  ConverterRender,
  WidgetRender
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Renders.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/data.js
try { (() => {
window.CC_DATA = {
  rates: {
    USD: 1,
    EUR: 0.9214,
    GBP: 0.7838,
    JPY: 151.82,
    CHF: 0.8812,
    CAD: 1.3741,
    AUD: 1.5226,
    CNY: 7.2431,
    INR: 83.41,
    MXN: 17.06,
    SEK: 10.52,
    SGD: 1.3464
  },
  names: {
    USD: ['US Dollar', '$'],
    EUR: ['Euro', '€'],
    GBP: ['British Pound', '£'],
    JPY: ['Japanese Yen', '¥'],
    CHF: ['Swiss Franc', 'Fr'],
    CAD: ['Canadian Dollar', '$'],
    AUD: ['Australian Dollar', '$'],
    CNY: ['Chinese Yuan', '¥'],
    INR: ['Indian Rupee', '₹'],
    MXN: ['Mexican Peso', '$'],
    SEK: ['Swedish Krona', 'kr'],
    SGD: ['Singapore Dollar', '$']
  },
  nav: ['Convert', 'Currencies', 'Rates', 'Widgets', 'Pro', 'Support'],
  footer: [{
    heading: 'Convert',
    links: ['Calculator', 'Currencies', 'Widgets', 'Offline mode']
  }, {
    heading: 'Rates',
    links: ['Live rates', 'History', 'Sources', 'API']
  }, {
    heading: 'Account',
    links: ['Sign in', 'Currculator Pro', 'Manage plan']
  }, {
    heading: 'About',
    links: ['Company', 'Privacy', 'Contact']
  }],
  convert(amount, from, to) {
    const r = this.rates;
    return amount / r[from] * r[to];
  },
  fmt(n, cur) {
    return n.toLocaleString('en-US', {
      minimumFractionDigits: cur === 'JPY' ? 0 : 2,
      maximumFractionDigits: cur === 'JPY' ? 0 : 2
    });
  }
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/data.js", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.TextLink = __ds_scope.TextLink;

__ds_ns.OptionChip = __ds_scope.OptionChip;

__ds_ns.SearchInput = __ds_scope.SearchInput;

__ds_ns.Footer = __ds_scope.Footer;

__ds_ns.GlobalNav = __ds_scope.GlobalNav;

__ds_ns.StickyBar = __ds_scope.StickyBar;

__ds_ns.SubNav = __ds_scope.SubNav;

__ds_ns.ProductTile = __ds_scope.ProductTile;

__ds_ns.QuoteCard = __ds_scope.QuoteCard;

__ds_ns.UtilityCard = __ds_scope.UtilityCard;

})();
