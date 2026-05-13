import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Link } from 'expo-router';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { bloomAssets } from '@/constants/bloom-assets';
import { bloomPalette } from '@/constants/bloom';
import { bloomDemoFeed, bloomDemoPlants, bloomDemoStats } from '@/constants/bloom-demo';
import { Fonts } from '@/constants/theme';
import { useBackendSnapshot } from '@/hooks/use-backend-snapshot';

function percentageAverage(values: number[]) {
  if (!values.length) {
    return 0;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export default function OverviewScreen() {
  const snapshot = useBackendSnapshot();
  const primaryDevice = snapshot.devices[0];
  const plants = snapshot.devices.flatMap((device) =>
    device.plants.map((plant, index) => ({
      ...plant,
      slug: device.slug,
      image: bloomAssets.gardenPlants[index % bloomAssets.gardenPlants.length],
    }))
  );
  const fallbackSlug = primaryDevice?.slug ?? bloomDemoFeed[0].slug;
  const visualPlants = plants.length
    ? plants
    : bloomDemoPlants.map((plant, index) => ({
        ...plant,
        slug: fallbackSlug,
        image: bloomAssets.gardenPlants[index % bloomAssets.gardenPlants.length],
      }));
  const featuredPlants = visualPlants.slice(0, 5);
  const liveDevices = snapshot.devices.filter((device) => device.connected).length || bloomDemoStats.liveDevices;
  const needsAttention = plants.length
    ? plants.filter((plant) => plant.levelPercent < 35).length
    : bloomDemoStats.needsAttention;
  const moisture = plants.length
    ? percentageAverage(plants.map((plant) => plant.levelPercent))
    : bloomDemoStats.moisture;
  const feedCards = (snapshot.devices.length ? snapshot.devices : []).slice(0, 3);
  while (feedCards.length < 3) {
    const fallback = bloomDemoFeed[feedCards.length];
    if (!fallback) {
      break;
    }

    feedCards.push({
      ...fallback,
      slug: primaryDevice?.slug ?? fallback.slug,
      plantsOnline: 0,
      pendingCommands: 0,
      lightTemplate: 'Bloom default',
      lastHeartbeat: fallback.connected ? 'online' : 'offline',
      plants: [],
    });
  }
  const spotlightHref = (primaryDevice ? `/device/${primaryDevice.slug}` : '/devices') as never;
  const featureCards = [
    {
      title: 'Diagnose',
      description: 'Open any greenhouse, review plant health and trigger fast watering actions.',
      href: '/devices' as never,
      image: bloomAssets.gardenPlants[2],
    },
    {
      title: 'Identify',
      description: 'Track which zones are stable and which plants need a fresh look.',
      href: '/devices' as never,
      image: bloomAssets.gardenPlants[3],
    },
    {
      title: 'IOT Watering',
      description: 'See aggregate moisture signals before you send commands to the rack.',
      href: spotlightHref,
      image: bloomAssets.gardenPlants[4],
    },
    {
      title: 'Reminders',
      description: 'Keep your care flow tidy with a schedule view and live activity summary.',
      href: '/activity' as never,
      image: bloomAssets.gardenPlants[1],
    },
  ];

  return (
    <>
      <StatusBar style="light" />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 126,
          gap: 18,
        }}
        refreshControl={<RefreshControl refreshing={snapshot.isRefreshing} onRefresh={() => void snapshot.refresh()} />}
        style={{ flex: 1, backgroundColor: bloomPalette.background }}
      >
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 282,
            overflow: 'hidden',
            borderBottomLeftRadius: 36,
            borderBottomRightRadius: 36,
          }}
        >
          <Image source={bloomAssets.homeHero} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          <View
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              backgroundColor: bloomPalette.heroOverlay,
            }}
          />
        </View>

        <View
          style={{
            marginTop: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              backgroundColor: bloomPalette.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialIcons name="spa" size={22} color={bloomPalette.primary} />
          </View>

          <View style={{ alignItems: 'center', gap: 3 }}>
            <Text
              style={{
                color: 'rgba(255,255,255,0.82)',
                fontFamily: Fonts.rounded,
                fontSize: 12,
              }}
            >
              Your location
            </Text>
            <Text
              selectable
              style={{
                color: bloomPalette.surface,
                fontFamily: Fonts.rounded,
                fontSize: 15,
              }}
            >
              {primaryDevice?.name ?? 'Greenhouse network'}
            </Text>
          </View>

          <Link href={'/settings' as never} asChild>
            <Pressable
              style={{
                width: 44,
                height: 44,
                borderRadius: 999,
                backgroundColor: bloomPalette.surface,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons name="notifications-none" size={22} color={bloomPalette.primaryText} />
              <View
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 8,
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  backgroundColor: bloomPalette.coral,
                }}
              />
            </Pressable>
          </Link>
        </View>

        <Link href="/devices" asChild>
          <Pressable
            style={{
              marginTop: 14,
              borderRadius: 30,
              backgroundColor: bloomPalette.surface,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              boxShadow: `0 12px 26px ${bloomPalette.shadow}`,
            }}
          >
            <MaterialIcons name="search" size={22} color={bloomPalette.mutedText} />
            <Text style={{ color: bloomPalette.mutedText, fontFamily: Fonts.rounded, fontSize: 14 }}>
              Search plants & flowers
            </Text>
          </Pressable>
        </Link>

        <View
          style={{
            marginTop: 22,
            borderRadius: 22,
            backgroundColor: bloomPalette.surface,
            paddingHorizontal: 18,
            paddingVertical: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: `0 16px 30px ${bloomPalette.shadow}`,
          }}
        >
          <View style={{ gap: 3 }}>
            <Text
              selectable
              style={{
                color: bloomPalette.primaryText,
                fontFamily: Fonts.serif,
                fontSize: 34,
                lineHeight: 38,
              }}
            >
              {moisture}%
            </Text>
            <Text style={{ color: bloomPalette.primaryText, fontFamily: Fonts.rounded, fontSize: 14 }}>
              Average moisture
            </Text>
            <Text style={{ color: bloomPalette.mutedText, fontFamily: Fonts.rounded, fontSize: 14 }}>
              {liveDevices} live racks, {needsAttention} zones need attention
            </Text>
          </View>
          <View
            style={{
              width: 82,
              height: 62,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialIcons name="thunderstorm" size={46} color={bloomPalette.yellow} />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 14 }}>
          {featuredPlants.map((plant, index) => (
            <View
              key={`${plant.slug}-${plant.name}`}
              style={{
                borderRadius: 22,
                backgroundColor: index === 0 ? bloomPalette.primary : bloomPalette.surface,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: index === 0 ? 6 : 7,
                paddingVertical: 6,
                minHeight: 44,
                minWidth: 44,
                boxShadow: index === 0 ? `0 12px 22px ${bloomPalette.shadow}` : undefined,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  overflow: 'hidden',
                  backgroundColor: bloomPalette.surfaceSoft,
                }}
              >
                <Image source={plant.image} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              </View>
              {index === 0 ? (
                <Text
                  selectable
                  style={{
                    marginLeft: 8,
                    marginRight: 10,
                    color: bloomPalette.surface,
                    fontFamily: Fonts.rounded,
                    fontSize: 12,
                  }}
                >
                  {plant.name}
                </Text>
              ) : null}
            </View>
          ))}
        </View>

        <View
          style={{
            borderRadius: 20,
            backgroundColor: bloomPalette.surface,
            padding: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <View
            style={{
              width: 90,
              height: 126,
              borderRadius: 12,
              backgroundColor: bloomPalette.surfaceMuted,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <Image source={bloomAssets.gardenPlants[0]} style={{ width: 80, height: 110 }} contentFit="contain" />
          </View>
          <View style={{ flex: 1, gap: 8 }}>
            <Text
              selectable
              style={{
                color: bloomPalette.primary,
                fontFamily: Fonts.serif,
                fontSize: 28,
                lineHeight: 30,
              }}
            >
              Check your plant
            </Text>
            <Text
              selectable
              style={{
                color: bloomPalette.mutedText,
                fontFamily: Fonts.rounded,
                fontSize: 13,
                lineHeight: 19,
              }}
            >
              Open the main rack, scan moisture levels, review the latest event and send watering in one tap.
            </Text>
            <Link href={spotlightHref} asChild>
              <Pressable
                style={{
                  alignSelf: 'flex-start',
                  borderRadius: 999,
                  backgroundColor: bloomPalette.primary,
                  paddingHorizontal: 28,
                  paddingVertical: 10,
                }}
              >
                <Text style={{ color: bloomPalette.surface, fontFamily: Fonts.rounded, fontSize: 12 }}>Diagnose</Text>
              </Pressable>
            </Link>
          </View>
        </View>

        <View style={{ gap: 14 }}>
          <Text style={{ color: bloomPalette.primaryText, fontFamily: Fonts.rounded, fontSize: 24 }}>All Features</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 16 }}>
            {featureCards.map((card) => (
              <Link key={card.title} href={card.href} asChild>
                <Pressable
                  style={{
                    width: '48%',
                    minHeight: 182,
                    borderRadius: 18,
                    backgroundColor: '#F7F7F7',
                    paddingHorizontal: 12,
                    paddingTop: 14,
                    overflow: 'hidden',
                  }}
                >
                  <Text
                    selectable
                    style={{
                      color: bloomPalette.primaryText,
                      fontFamily: Fonts.serif,
                      fontSize: 18,
                    }}
                  >
                    {card.title}
                  </Text>
                  <Text
                    selectable
                    style={{
                      color: bloomPalette.mutedText,
                      fontFamily: Fonts.rounded,
                      fontSize: 12,
                      lineHeight: 18,
                      marginTop: 6,
                      maxWidth: 128,
                    }}
                  >
                    {card.description}
                  </Text>
                  <Image
                    source={card.image}
                    style={{
                      position: 'absolute',
                      right: -6,
                      bottom: -4,
                      width: 114,
                      height: 114,
                    }}
                    contentFit="contain"
                  />
                </Pressable>
              </Link>
            ))}
          </View>
        </View>

        <View
          style={{
            borderRadius: 18,
            backgroundColor: bloomPalette.surface,
            padding: 16,
            gap: 12,
          }}
        >
          <Text style={{ color: bloomPalette.primaryText, fontFamily: Fonts.rounded, fontSize: 16 }}>
            Live greenhouse feed
          </Text>
          {feedCards.map((device) => (
            <Link key={`${device.slug}-${device.name}`} href={`/device/${device.slug}`} asChild>
              <Pressable
                style={{
                  borderRadius: 16,
                  backgroundColor: bloomPalette.surfaceSoft,
                  paddingHorizontal: 14,
                  paddingVertical: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ color: bloomPalette.primaryText, fontFamily: Fonts.serif, fontSize: 18 }}>
                    {device.name}
                  </Text>
                  <Text style={{ color: bloomPalette.mutedText, fontFamily: Fonts.rounded, fontSize: 12 }}>
                    {device.lastEvent}
                  </Text>
                </View>
                <MaterialIcons
                  name={device.connected ? 'radio-button-checked' : 'radio-button-unchecked'}
                  size={18}
                  color={device.connected ? bloomPalette.primary : bloomPalette.warning}
                />
              </Pressable>
            </Link>
          ))}
        </View>
      </ScrollView>
    </>
  );
}
