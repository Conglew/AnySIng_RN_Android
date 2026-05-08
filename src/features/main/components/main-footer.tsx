import { Href, router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type FooterItem = {
  label: string;
  route: Href;
  icon: string;
};

const FOOTER_ITEMS: FooterItem[] = [
  {
    label: '主頁',
    route: '/(tabs)/home',
    icon: '⌂',
  },
  {
    label: '點歌',
    route: '/(tabs)/two',
    icon: '▦',
  },
  {
    label: '調音',
    route: '/(tabs)/tuning' as Href,
    icon: '≡',
  },
  {
    label: '切歌',
    route: '/(tabs)/switch-song' as Href,
    icon: '♬',
  },
  {
    label: '暫停',
    route: '/(tabs)/pause' as Href,
    icon: 'Ⅱ',
  },
  {
    label: '原唱',
    route: '/(tabs)/original' as Href,
    icon: '♩',
  },
  {
    label: '重唱',
    route: '/(tabs)/restart' as Href,
    icon: '↻',
  },
  {
    label: '已點',
    route: '/(tabs)/queue' as Href,
    icon: '≡',
  },
  {
    label: '錄製',
    route: '/(tabs)/record' as Href,
    icon: '◎',
  },
];

export function MainFooter() {
  const pathname = usePathname();

  return (
    <View style={styles.footer}>
      {FOOTER_ITEMS.map((item) => {
        const isActive = pathname === item.route;

        return (
          <Pressable
            key={String(item.route)}
            style={({ pressed }) => [styles.footerItem, pressed && styles.footerItemPressed]}
            onPress={() => {
              router.replace(item.route);
            }}
          >
            <Text style={[styles.footerIcon, isActive && styles.footerIconActive]}>
              {item.icon}
            </Text>

            <Text style={[styles.footerLabel, isActive && styles.footerLabelActive]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    height: 86,
    paddingHorizontal: 30,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#000000',
  },

  footerItem: {
    width: 130,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },

  footerItemPressed: {
    opacity: 0.72,
  },

  footerIcon: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },

  footerIconActive: {
    color: '#FFFFFF',
  },

  footerLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },

  footerLabelActive: {
    color: '#A78BFA',
    textDecorationLine: 'underline',
  },
});
