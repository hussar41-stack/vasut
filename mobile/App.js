import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Map, Train, Bus, CreditCard, Search } from 'lucide-react-native';

const COLORS = {
  bg: '#0a0e1a',
  card: '#111827',
  accent: '#3b82f6',
  text: '#f1f5f9',
  secondary: '#94a3b8'
};

function HomeScreen() {
  const [news, setNews] = React.useState([
    { id: '1', type: 'alert', text: '🔴 M3 metró felújítás miatt pótlóbusz közlekedik.' },
    { id: '2', type: 'news', text: '🌟 Új Stadler KISS vonatok álltak forgalomba.' },
    { id: '3', type: 'info', text: 'ℹ️ Kellemes utazást kíván a TransportHU!' }
  ]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header with Logo */}
        <View style={styles.header}>
          <Image 
            source={require('./assets/icon.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Search Card */}
        <View style={styles.searchCard}>
          <Text style={styles.cardTitle}>MENETREND KERESÉS</Text>
          <View style={styles.inputGroup}>
            <Search size={18} color={COLORS.secondary} style={styles.inputIcon} />
            <Text style={styles.inputText}>Honnan: Budapest-Keleti</Text>
          </View>
          <View style={[styles.inputGroup, { marginTop: 8 }]}>
            <Map size={18} color={COLORS.secondary} style={styles.inputIcon} />
            <Text style={styles.inputText}>Hova: Győr</Text>
          </View>
          <TouchableOpacity style={[styles.btn, { marginTop: 16 }]}>
            <Text style={styles.btnText}>Járatok keresése</Text>
          </TouchableOpacity>
        </View>

        {/* Live News Section */}
        <View style={styles.newsSection}>
          <Text style={styles.sectionTitle}>ÉLŐ HÍREK & INFÓK</Text>
          {news.map(item => (
            <View key={item.id} style={styles.newsItem}>
              <Text style={styles.newsText}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* Quick Map Access */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.qcBox}>
            <Train size={32} color={COLORS.accent} />
            <Text style={styles.qcText}>MÁV Térkép</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.qcBox}>
            <Bus size={32} color="#facc15" />
            <Text style={styles.qcText}>BKK Járatok</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer theme={{ colors: { background: COLORS.bg, card: COLORS.card, text: COLORS.text, primary: COLORS.accent, border: 'rgba(255,255,255,0.05)' } }}>
      <Tab.Navigator screenOptions={{ 
          headerShown: false, 
          tabBarStyle: { backgroundColor: COLORS.card, borderTopColor: 'rgba(255,255,255,0.05)', height: 64, paddingBottom: 8 },
          tabBarActiveTintColor: COLORS.accent,
          tabBarInactiveTintColor: COLORS.secondary
        }}>
        <Tab.Screen name="Menetrend" component={HomeScreen} options={{ tabBarIcon: ({ color, size }) => <Search size={size} color={color} /> }} />
        <Tab.Screen name="MÁV" component={HomeScreen} options={{ tabBarIcon: ({ color, size }) => <Train size={size} color={color} /> }} />
        <Tab.Screen name="BKK" component={HomeScreen} options={{ tabBarIcon: ({ color, size }) => <Bus size={size} color={color} /> }} />
        <Tab.Screen name="Jegyeim" component={HomeScreen} options={{ tabBarIcon: ({ color, size }) => <CreditCard size={size} color={color} /> }} />
      </Tab.Navigator>
      <StatusBar style="light" />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  logo: {
    width: 250,
    height: 120,
  },
  searchCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  cardTitle: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: 1,
  },
  inputGroup: {
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  inputIcon: {
    marginRight: 12,
  },
  inputText: {
    color: '#cbd5e1',
    fontSize: 15,
  },
  newsSection: {
    marginTop: 24,
  },
  sectionTitle: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: 1.2,
  },
  newsItem: {
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  newsText: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 18,
  },
  btn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  qcBox: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  qcText: {
    color: '#fff',
    marginTop: 10,
    fontWeight: '600',
    fontSize: 14,
  }
});
