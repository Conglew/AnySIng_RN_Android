import { Text, TextProps } from './Themed';

export function MonoText(props: TextProps) {
  return <Text {...props} style={[props.style, { fontFamily: 'SpaceMono' }]} />;
}

export function HemiHeadText(props: TextProps) {
  return <Text {...props} style={[props.style, { fontFamily: 'HemiHeadBdIt' }]} />;
}

export function NotoSansText(props: TextProps) {
  return <Text {...props} style={[props.style, { fontFamily: 'NotoSansVariable' }]} />;
}

export function NotoSansTCText(props: TextProps) {
  return <Text {...props} style={[props.style, { fontFamily: 'NotoSansTCVariable' }]} />;
}

export function NotoSansSCText(props: TextProps) {
  return <Text {...props} style={[props.style, { fontFamily: 'NotoSansSCVariable' }]} />;
}

export function NotoSansItalicText(props: TextProps) {
  return <Text {...props} style={[props.style, { fontFamily: 'NotoSansItalic' }]} />;
}
