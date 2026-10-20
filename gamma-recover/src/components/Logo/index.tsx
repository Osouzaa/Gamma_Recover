import styled from 'styled-components';
const Signature = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  img {
    display: block;
    flex-shrink: 0;
  }
`;
export function Logo({ size = 36, inverse = false }: { size?: number; inverse?: boolean }) {
  return (
    <Signature role="img" aria-label="Gamma Recover">
      <img src="/brand/gamma-symbol.svg" width={size} height={size} alt="" aria-hidden="true" />
      <img
        data-brand-copy
        src={`/brand/wordmark-${inverse ? 'light' : 'dark'}.svg`}
        width={Math.round((size * 180) / 64)}
        height={size}
        alt=""
        aria-hidden="true"
      />
    </Signature>
  );
}
