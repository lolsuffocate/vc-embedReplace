/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";
import { Clickable, Forms, Icons, React, Switch, TextInput, TooltipContainer } from "@webpack/common";

type Replacement = { match: string, replace: string, isRegex: boolean, key: string, toSave?: boolean, toDelete?: boolean, newEntry?: boolean };

type RowProps = {
    replacement: Replacement,
    newRow?: boolean,
    onChange: (replacement: Replacement) => void
};

const ReplacementRow = (props: RowProps) => {
    const [match, setMatch] = React.useState(props.replacement.match);
    const [replace, setReplace] = React.useState(props.replacement.replace);
    const [isRegex, setIsRegex] = React.useState(props.replacement.isRegex);
    const [errorString, setErrorString] = React.useState<string>();
    const [isValid, setIsValid] = React.useState(false);
    const [stateChanged, setStateChanged] = React.useState(false);
    const [validAndChanged, setValidAndChanged] = React.useState(false);
    const [pendingSave, setPendingSave] = React.useState(props.replacement?.toSave ?? false);
    const [pendingDelete, setPendingDelete] = React.useState(props.replacement?.toDelete ?? false);
    const storeVersion = settings.store.replacements?.find(rep => rep.key === props.replacement.key);
    const before = {
        match: storeVersion?.match ?? "",
        replace: storeVersion?.replace ?? "",
        isRegex: storeVersion?.isRegex ?? false,
        key: props.replacement.key
    };

    React.useEffect(() => {
        const stateHasChanged = before.match !== match || before.replace !== replace || before.isRegex !== isRegex;
        setStateChanged(stateHasChanged);

        if (isRegex) {
            try {
                new RegExp(match);
                setErrorString(undefined);
            } catch (err: any) {
                setErrorString(err.message);
                setIsValid(false);
                return;
            }
        }
        setIsValid((match !== undefined && replace !== undefined && match !== null && replace !== null && match !== "" && replace !== "") as boolean);
        setValidAndChanged(stateHasChanged && isValid);
        if (props?.newRow) return;

        if (stateHasChanged) {
            props.onChange({ match, replace, isRegex, key: props.replacement.key, toSave: true });
            if(!pendingSave) setPendingSave(true);
        }else{
            props.onChange({ match, replace, isRegex, key: props.replacement.key, toSave: false });
            if(pendingSave) setPendingSave(false);
        }
    }, [match, replace, isRegex]);

    return <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px"
    }
    &&
    pendingDelete ? {
            backgroundColor: "rgba(255,0,0,0.2)",
            border: "1px solid rgba(255,0,0,0.5)",
            borderRadius: "4px"
        }
        : pendingSave && !props.newRow ? {
                backgroundColor: "rgba(72,255,0,0.2)",
                border: "1px solid rgba(72,255,0,0.5)",
                borderRadius: "4px"
            }
            : { backgroundColor: "transparent", border: "1px solid transparent", borderRadius: "4px" }
    }>
        <div style={{ display: "flex", flexDirection: "row", gap: "8px" }}>
            <div
                style={{ width: "40%" }}> {/* setting style directly on TextInput doesn't work because it gets wrapped in a div */}
                <TextInput value={match}
                           placeholder={"Match" + (isRegex ? " Regex" : " Text")}
                           onChange={setMatch}
                           error={errorString}
                           disabled={pendingDelete}
                           label="Match"/>
            </div>
            <div style={{ width: "40%" }}>
                <TextInput value={replace}
                           onChange={setReplace}
                           placeholder="Replace"
                           disabled={pendingDelete}
                           label="Replace"/>
            </div>
            {props?.newRow && <div style={{ width: "5%" }}>
                <TooltipContainer text="Save">
                    <Clickable
                        style={{
                            justifyContent: "center",
                            alignItems: "center",
                            borderRadius: "2px",
                            padding: "8px",
                            width: "fit-content",
                            height: "fit-content"
                        }}
                        onMouseOver={event => {
                            if (validAndChanged) {
                                event.currentTarget.style.cursor = "pointer";
                                event.currentTarget.style.backgroundColor = "rgba(112,188,85,0.6)";
                            } else {
                                event.currentTarget.style.cursor = "not-allowed";
                                event.currentTarget.style.backgroundColor = "rgba(188,85,85,0.6)";
                            }
                        }}
                        onMouseOut={event => {
                            event.currentTarget.style.cursor = "default";
                            event.currentTarget.style.backgroundColor = "transparent";
                        }}
                        onClick={() => {
                            if (!validAndChanged) return;

                            const updatedReplacement = {
                                match,
                                replace,
                                isRegex,
                                key: props?.newRow ? Math.random().toString(36).substring(7) : props.replacement.key,
                                newEntry: true,
                                toSave: true
                            };

                            props.onChange(updatedReplacement);

                            setMatch("");
                            setReplace("");
                            setIsRegex(false);
                        }}>
                        <Icons.PlusMediumIcon name="Save"
                                              style={{ alignSelf: "center" }}
                                              {...(validAndChanged ? { color: "green" } : { color: "grey" })}/>
                    </Clickable>
                </TooltipContainer>
            </div>}
            {!props?.newRow &&
                <div style={{ width: "5%" }}>
                    <TooltipContainer text="Delete">
                        <Clickable
                            style={{
                                justifyContent: "center",
                                alignItems: "center",
                                borderRadius: "2px",
                                padding: "8px",
                                width: "fit-content",
                                height: "fit-content"
                            }}
                            onMouseOver={event => {
                                event.currentTarget.style.cursor = "pointer";
                                event.currentTarget.style.backgroundColor = "rgba(188,85,85,0.6)";
                            }}
                            onMouseOut={event => {
                                event.currentTarget.style.cursor = "default";
                                event.currentTarget.style.backgroundColor = "transparent";
                            }}
                            onClick={() => {
                                const newPendingDelete = !pendingDelete;

                                const updatedReplacement = {
                                    match,
                                    replace,
                                    isRegex,
                                    key: props.replacement.key,
                                    toSave: false,
                                    toDelete: newPendingDelete,
                                    newEntry: before.match === "" && before.replace === "" && before.isRegex === false
                                };

                                props.onChange(updatedReplacement);

                                setPendingDelete(newPendingDelete);
                            }}>
                            <Icons.TrashIcon name="Delete"
                                             style={{ alignSelf: "center" }}
                                             color="red"/>
                        </Clickable>
                    </TooltipContainer>
                </div>}
        </div>
        <div style={{ display: "flex", flexDirection: "row", gap: "8px" }}>
            <div style={{ width: "40%" }}>
                <Switch value={isRegex}
                        onChange={setIsRegex}
                        style={{ marginRight: "8px" }}
                        disabled={pendingDelete}>
                    Is Regex
                </Switch>
            </div>
            <div style={{ width: "40%" }}>
            </div>
            {!props.newRow && <div style={{ width: "5%" }}>
                <TooltipContainer text="Duplicate">
                    <Clickable
                        style={{
                            justifyContent: "center",
                            alignItems: "center",
                            borderRadius: "2px",
                            padding: "8px",
                            width: "fit-content",
                            height: "fit-content"
                        }}
                        onMouseOver={event => {
                            event.currentTarget.style.cursor = "pointer";
                            event.currentTarget.style.backgroundColor = "rgba(112,188,85,0.6)";
                        }}
                        onMouseOut={event => {
                            event.currentTarget.style.cursor = "default";
                            event.currentTarget.style.backgroundColor = "transparent";
                        }}
                        onClick={() => {
                            const newRep = {
                                match,
                                replace,
                                isRegex,
                                key: Math.random().toString(36).substring(7),
                                newEntry: true,
                                toSave: isValid
                            };

                            props.onChange(newRep);
                        }}>
                        <Icons.CopyIcon name="Duplicate"
                                        style={{ alignSelf: "center" }}
                                        color={"grey"}/>
                    </Clickable>
                </TooltipContainer>
            </div>}
            {(pendingSave || pendingDelete) && !props.newRow ? <div style={{ width: "5%" }}>
                <TooltipContainer text="Reset">
                    <Clickable
                        style={{
                            justifyContent: "center",
                            alignItems: "center",
                            borderRadius: "2px",
                            padding: "8px",
                            width: "fit-content",
                            height: "fit-content"
                        }}
                        onMouseOver={event => {
                            event.currentTarget.style.cursor = "pointer";
                            event.currentTarget.style.backgroundColor = "rgba(188,85,85,0.6)";
                        }}
                        onMouseOut={event => {
                            event.currentTarget.style.cursor = "default";
                            event.currentTarget.style.backgroundColor = "transparent";
                        }}
                        onClick={() => {
                            if (!(pendingDelete || pendingSave)) return;

                            setMatch(before.match);
                            setReplace(before.replace);
                            setIsRegex(before.isRegex);
                            setPendingSave(false);
                            setPendingDelete(false);

                            const updatedReplacement = {
                                match: before.match,
                                replace: before.replace,
                                isRegex: before.isRegex,
                                key: props.replacement.key,
                                toSave: false,
                                toDelete: before.match === "" && before.replace === "" && before.isRegex === false,
                                newEntry: before.match === "" && before.replace === "" && before.isRegex === false
                            };
                            props.onChange(updatedReplacement);

                        }}>
                        <Icons.UndoIcon name="Reset"
                                        style={{ alignSelf: "center" }}
                                        color="red"/>
                    </Clickable>
                </TooltipContainer>
            </div> : null}
        </div>
    </div>;
};

export const settings = definePluginSettings({
    replacements: {
        type: OptionType.COMPONENT,
        description: "The URL replacements to apply",
        component(componentProps) {
            React.useEffect(() => {
                componentProps.setError(true);
            }, []);
            const [saveEnabled, setSaveEnabled] = React.useState(false);
            const [saveValues, setSaveValues] = React.useState<Replacement[]>([]);

            React.useEffect(() => {
                componentProps.setError(!saveEnabled);
            }, [saveEnabled]);

            React.useEffect(() => {
                componentProps.setValue(saveValues.map(rep => {
                    return { match: rep.match, replace: rep.replace, isRegex: rep.isRegex, key: rep.key };
                }));
            }, [saveValues]);

            // clone the existing settings array so we don't accidentally modify the original
            const clonedReplacements = settings.store.replacements?.map(rep => {
                return { ...rep };
            });

            const [reps, setReplacements] = React.useState(clonedReplacements ?? []);

            React.useEffect(() => {
                for (const rep of reps) {
                    if (rep.toSave || rep.toDelete) {
                        setSaveEnabled(true);
                        return;
                    }
                }
                setSaveEnabled(false);
            }, [reps]);

            const onChange = (newRep: Replacement) => {
                setReplacements(prevReps => {
                    if (newRep.newEntry && !prevReps.some(rep => rep.key === newRep.key)) {
                        return [...prevReps, newRep];
                    }
                    const newReps = prevReps.map(rep => {
                        if (rep.key === newRep.key) {
                            rep.match = newRep.match;
                            rep.replace = newRep.replace;
                            rep.isRegex = newRep.isRegex;
                            rep.toSave = newRep.toSave;
                            rep.toDelete = newRep.toDelete;
                            rep.newEntry = newRep?.newEntry;
                        }
                        return rep;
                    }).filter(rep => !(rep.newEntry && rep.toDelete));

                    setSaveValues(newReps.filter(rep => !rep.toDelete));

                    return newReps;
                });
            };

            const inners = reps?.map((rep, _) => {
                return <ReplacementRow replacement={rep} onChange={onChange}/>;
            });

            return <Forms.FormSection title="URL Replacements">
                <Forms.FormText>These replacements will be applied to URLs before they are used to fetch
                    embeds</Forms.FormText>
                <Forms.FormText>Changes do not take effect until you save and close</Forms.FormText>
                <Forms.FormText>Any changes will only take effect on newly loaded embeds, reload to apply to already
                    loaded embeds</Forms.FormText>
                <ReplacementRow replacement={{ match: "", replace: "", isRegex: false, key: "" }} newRow={true} onChange={onChange} />;
                {inners}
            </Forms.FormSection>;
        }
    }
}).withPrivateSettings<{
    replacements: Replacement[]
}>();
