package com.pamana.common;

import com.pamana.progress.ModuleLockService;
import com.pamana.progress.ModuleProgressRepository;
import com.pamana.common.BaseGameService;

import org.springframework.beans.factory.annotation.Autowired;

public abstract class BaseGameService {

    @Autowired
    protected ModuleProgressRepository moduleProgressRepository;

    @Autowired
    protected ModuleLockService moduleLockService;
}
