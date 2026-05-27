package com.pamana.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Map /static/assets/** to classpath:/static/assets/ to explicitly route static audio and images
        registry.addResourceHandler("/static/assets/**")
                .addResourceLocations("classpath:/static/assets/");
    }
}
