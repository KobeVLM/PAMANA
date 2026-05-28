package com.pamana.service;

import com.pamana.repository.ModuleProgressRepository;
import org.springframework.beans.factory.annotation.Autowired;

public abstract class BaseGameService {

    @Autowired
    protected ModuleProgressRepository moduleProgressRepository;

    @Autowired
    protected ModuleLockService moduleLockService;
}
