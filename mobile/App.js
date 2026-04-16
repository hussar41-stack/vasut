import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { api } from './src/api';

const Stack = createStackNavigator();

function ResultsScreen({ route }) {
  const { trips } = route.params;
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>AJÁNLATOK ({trips.length})</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {trips.map(trip => (
          <View key={trip.id} style={styles.tripCard}>
            <View style={styles.tripRow}>
              <Text style={styles.tripTime}>{trip.departureTime}</Text>
              <View style={styles.tripLine} />
              <Text style={styles.tripTime}>{trip.arrivalTime}</Text>
            </View>
            <View style={styles.tripMeta}>
              <Text style={styles.tripTrain}>{trip.trainName}</Text>
              {trip.type && <Text style={[styles.badge, (styles[`badge_${trip.type}`] || {})]}>{trip.type}</Text>}
            </View>
            <View style={styles.tripFooter}>
              <Text style={styles.tripPrice}>{trip.price} Ft-tól <span>/ fő</span></Text>
            </View>
          </View>
        ))}
        {trips.length === 0 && <Text style={styles.emptyText}>Nincsenek találatok.</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

function MainHomeScreen({ navigation }) {
  const [from, setFrom] = React.useState('Budapest-Keleti');
  const [to, setTo] = React.useState('Győr');
  const [loading, setLoading] = React.useState(false);
  const [news, setNews] = React.useState([]);

  React.useEffect(() => {
    api.getNews().then(setNews).catch(err => console.log('News hiba', err));
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const results = await api.search({ from, to });
      navigation.navigate('Results', { trips: results.trips || [] });
    } catch (err) {
      alert('Keresési hiba: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Image source={require('./assets/icon.png')} style={styles.logo} resizeMode="contain" />
        </View>

        <View style={styles.searchCard}>
          <Text style={styles.cardTitle}>MENETREND KERESÉS</Text>
          <View style={styles.inputGroup}>
            <Search size={18} color={COLORS.secondary} style={styles.inputIcon} />
            <Text style={styles.inputText}>Honnan: {from}</Text>
          </View>
          <View style={[styles.inputGroup, { marginTop: 8 }]}>
            <Map size={18} color={COLORS.secondary} style={styles.inputIcon} />
            <Text style={styles.inputText}>Hova: {to}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.btn, { marginTop: 16, opacity: loading ? 0.6 : 1 }]} 
            onPress={handleSearch}
            disabled={loading}
          >
            <Text style={styles.btnText}>{loading ? 'Keresés...' : 'Járatok keresése'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.newsSection}>
          <Text style={styles.sectionTitle}>ÉLŐ HÍREK & INFÓK</Text>
          {news.length > 0 ? news.map((item, i) => (
            <View key={i} style={styles.newsItem}>
              <Text style={styles.newsText}>{item.text}</Text>
            </View>
          )) : <Text style={styles.emptyText}>Nincsenek aktív hírek.</Text>}
        </View>

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

function MenetrendStack() {
  return (
    <Stack.Navigator screenOptions={{ 
      headerStyle: { backgroundColor: COLORS.card, borderBottomColor: 'rgba(255,255,255,0.05)' },
      headerTintColor: COLORS.text,
      headerTitleStyle: { fontWeight: '800', fontSize: 13, letterSpacing: 0.5 }
    }}>
      <Stack.Screen name="TransportHU" component={MainHomeScreen} />
      <Stack.Screen name="Results" component={ResultsScreen} options={{ title: 'TALÁLATOK' }} />
    </Stack.Navigator>
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
        <Tab.Screen name="Menetrend" component={MenetrendStack} options={{ tabBarIcon: ({ color, size }) => <Search size={size} color={color} /> }} />
        <Tab.Screen name="MÁV" component={MainHomeScreen} options={{ tabBarIcon: ({ color, size }) => <Train size={size} color={color} /> }} />
        <Tab.Screen name="BKK" component={MainHomeScreen} options={{ tabBarIcon: ({ color, size }) => <Bus size={size} color={color} /> }} />
        <Tab.Screen name="Jegyeim" component={MainHomeScreen} options={{ tabBarIcon: ({ color, size }) => <CreditCard size={size} color={color} /> }} />
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
  emptyText: {
    color: COLORS.secondary,
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
  // Results Styles
  resultsHeader: {
    padding: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  resultsTitle: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  tripCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  tripTime: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  tripLine: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tripMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  tripTrain: {
    color: COLORS.secondary,
    fontSize: 14,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
    backgroundColor: '#475569',
  },
  badge_IC: { backgroundColor: '#ef4444' },
  badge_FAST: { backgroundColor: '#3b82f6' },
  tripFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 12,
  },
  tripPrice: {
    color: COLORS.accent,
    fontSize: 18,
    fontWeight: '800',
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
