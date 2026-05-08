import { Platform } from 'react-native';

const RoutePreviewMap =
    Platform.OS === 'web'
        ? require('./RoutePreviewMap.web').default
        : require('./RoutePreviewMap.native').default;

export default RoutePreviewMap;