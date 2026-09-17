import { Feather } from "@expo/vector-icons";
import { TextInput, TouchableOpacity, View, ViewStyle } from "react-native";
import { fontSizes, fonts } from "@/shared/constants";
import { moderateScale } from "@/shared/imports";
import { useColors } from "@/shared/theme";

type AppSearchProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  containerStyle?: ViewStyle;
  onPress?: () => void; // when used as non-editable button
  editable?: boolean;
};

export default function AppSearch({
  value,
  onChangeText,
  placeholder = "Search here...",
  containerStyle,
  onPress,
  editable = true,
}: AppSearchProps) {
  const theme = useColors();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={editable ? undefined : onPress}
      style={[
        {
          marginHorizontal: moderateScale(16),
          backgroundColor: theme.searchBackground,
          borderRadius: moderateScale(28),
        },
        containerStyle,
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: moderateScale(16),
          paddingVertical: moderateScale(14),
        }}
      >
        <Feather
          name="search"
          size={22}
          color={theme.textSecondary}
          style={{ marginRight: moderateScale(10) }}
        />
        <TextInput
          editable={editable}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.placeholder}
          style={{
            flex: 1,
            fontSize: fontSizes.p,
            fontFamily: fonts.subTitle,
            color: theme.text,
          }}
        />
      </View>
    </TouchableOpacity>
  );
}
