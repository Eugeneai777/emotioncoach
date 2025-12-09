import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CustomerServiceConfig {
  enabledModes: {
    text: boolean;
    voice_natural: boolean;
    voice_button: boolean;
  };
  defaultMode: 'text' | 'voice_natural' | 'voice_button';
  floatingButtonVisible: boolean;
}

const defaultConfig: CustomerServiceConfig = {
  enabledModes: {
    text: true,
    voice_natural: true,
    voice_button: true,
  },
  defaultMode: 'voice_natural',
  floatingButtonVisible: true,
};

export const useCustomerServiceConfig = () => {
  const [config, setConfig] = useState<CustomerServiceConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('customer_service_config')
          .select('config_key, config_value');

        if (error) {
          console.error('Error loading customer service config:', error);
          setLoading(false);
          return;
        }

        if (data && data.length > 0) {
          const configMap = data.reduce((acc, item) => {
            acc[item.config_key] = item.config_value;
            return acc;
          }, {} as Record<string, unknown>);

          setConfig({
            enabledModes: (configMap['enabled_modes'] as CustomerServiceConfig['enabledModes']) || defaultConfig.enabledModes,
            defaultMode: (configMap['default_mode'] as CustomerServiceConfig['defaultMode']) || defaultConfig.defaultMode,
            floatingButtonVisible: configMap['floating_button_visible'] !== false,
          });
        }
      } catch (err) {
        console.error('Error loading config:', err);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  // Get list of available modes
  const availableModes = Object.entries(config.enabledModes)
    .filter(([, enabled]) => enabled)
    .map(([mode]) => mode as keyof CustomerServiceConfig['enabledModes']);

  return {
    config,
    loading,
    availableModes,
  };
};
